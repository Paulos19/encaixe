'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- SCHEMAS ---
const CreateWaitlistSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
  description: z.string().optional(),
});

const TriggerSlotSchema = z.object({
  waitlistId: z.string().cuid(),
  slotTime: z.string().min(1, "Informe o horário da vaga"),
  slotId: z.string().optional(), // NOVO: Permite receber o ID do slot para validação
});

// --- HELPER: Formatação de Telefone ---
function formatPhoneForWhatsapp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // Adiciona 55 se for número brasileiro padrão (10 ou 11 dígitos)
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

// --- ACTIONS PÚBLICAS ---

export async function createWaitlist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const data = Object.fromEntries(formData.entries());
  const validated = CreateWaitlistSchema.safeParse(data);

  if (!validated.success) return { error: "Dados inválidos" };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    await prisma.waitlist.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        ownerId: user.id,
      },
    });

    revalidatePath('/dashboard/waitlists');
    return { success: true };
  } catch (error) {
    return { error: "Erro ao criar lista" };
  }
}

// Action chamada pelo botão "Disparar Vaga" no Dashboard
export async function triggerManualSlot(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const data = Object.fromEntries(formData.entries());
  const validated = TriggerSlotSchema.safeParse(data);

  if (!validated.success) return { error: "Dados inválidos" };

  // --- VALIDAÇÃO DE SEGURANÇA DO SLOT ---
  // Se um ID de slot for passado, verificamos se ele é válido e está livre.
  // Isso evita o problema de "ofertar data que não existe" ou duplicada.
  if (validated.data.slotId) {
    const slot = await prisma.agendaSlot.findUnique({
      where: { id: validated.data.slotId }
    });

    if (!slot) {
      return { error: "Horário não encontrado. Atualize a página." };
    }
    
    if (slot.isBooked) {
      return { error: "Este horário já foi ocupado por outro paciente." };
    }
  }
  // ---------------------------------------

  // Chama a lógica compartilhada
  const result = await findAndNotifyNextPatient(
    validated.data.waitlistId,
    validated.data.slotTime,
    validated.data.slotId // Repassa o ID validado para o fluxo do n8n
  );

  if (result.success) {
    revalidatePath(`/dashboard/waitlists/${validated.data.waitlistId}`);
    return { success: true, message: "Disparo iniciado para o próximo paciente!" };
  } else {
    return { error: result.error };
  }
}

// --- LÓGICA COMPARTILHADA (CORE DO SISTEMA) ---
export async function findAndNotifyNextPatient(waitlistId: string, slotTime: string, slotId?: string) {
  try {
    // 1. Validar a Lista e o Dono
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { owner: true }
    });

    if (!waitlist) return { error: "Lista não encontrada" };

    const owner = waitlist.owner;
    
    // Verificação de Limites
    if (owner.messagesSent >= owner.messageLimit) {
      console.warn(`[LIMIT] Usuário ${owner.email} atingiu o limite.`);
      return { error: "Limite de mensagens do plano atingido." };
    }

    // 2. Encontrar o próximo paciente (FIFO + Prioridade)
    const nextEntry = await prisma.waitlistEntry.findFirst({
      where: {
        waitlistId: waitlistId,
        status: 'WAITING', // Só quem ainda não foi chamado
      },
      orderBy: [
        { priority: 'desc' }, // Primeiro os VIPs
        { addedAt: 'asc' },   // Depois quem chegou primeiro
      ],
      include: { patient: true }
    });

    if (!nextEntry) {
      return { error: "Fila vazia! Ninguém para chamar." };
    }

    // 3. Disparar para o n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) return { error: "Erro de configuração do servidor" };

    // Formatação do telefone
    const formattedPhone = formatPhoneForWhatsapp(nextEntry.patient.phone);

    // Disparo assíncrono para o Webhook do n8n
    await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waitlistId,
        patientId: nextEntry.patient.id,
        patientName: nextEntry.patient.name,
        phone: formattedPhone,
        slotTime: slotTime,
        slotId: slotId || null // <--- Enviamos o ID para o n8n guardar no Redis
      })
    });

    // 4. Atualizar Estado no Banco (Transação Atômica)
    await prisma.$transaction([
      // Marca o paciente como NOTIFIED
      prisma.waitlistEntry.update({
        where: { id: nextEntry.id },
        data: { 
          status: 'NOTIFIED',
          updatedAt: new Date()
        }
      }),
      // Incrementa o contador de uso do cliente
      prisma.user.update({
        where: { id: owner.id },
        data: { messagesSent: { increment: 1 } }
      })
    ]);

    return { success: true };

  } catch (error) {
    console.error("Erro no loop de disparo:", error);
    return { error: "Erro interno ao processar fila." };
  }
}

export async function updateEntryStatus(entryId: string, status: string, waitlistId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: status as any } // Forçando o tipo para aceitar a string do Enum
    });

    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { error: "Erro ao atualizar status." };
  }
}

// --- NOVAS ACTIONS DE GESTÃO DA FILA ---

// Move o paciente para o final da fila (reseta status para WAITING e atualiza data)
export async function moveEntryToEnd(entryId: string, waitlistId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        addedAt: new Date(), // Atualiza a data para AGORA (fim da fila FIFO)
        status: 'WAITING'    // Reseta status para poder ser chamado novamente
      }
    });
    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao mover para o final:", error);
    return { error: "Erro ao mover paciente." };
  }
}

// Remove o paciente da fila permanentemente
export async function deleteEntry(entryId: string, waitlistId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    await prisma.waitlistEntry.delete({
      where: { id: entryId }
    });
    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover da fila:", error);
    return { error: "Erro ao remover paciente." };
  }
}