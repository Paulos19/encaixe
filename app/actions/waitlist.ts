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
    // 1. Busca a lista e o dono
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { owner: true }
    });

    if (!waitlist) return { error: "Lista não encontrada" };

    const owner = waitlist.owner;
    
    // Verifica limites do plano
    if (owner.messagesSent >= owner.messageLimit) {
      return { error: "Limite de mensagens do plano atingido." };
    }

    // 2. Busca o próximo da fila (FIFO + Prioridade)
    const nextEntry = await prisma.waitlistEntry.findFirst({
      where: {
        waitlistId: waitlistId,
        status: 'WAITING',
      },
      orderBy: [
        { priority: 'desc' }, // Alta prioridade primeiro
        { addedAt: 'asc' },   // Quem chegou antes primeiro
      ],
      include: { patient: true }
    });

    if (!nextEntry) {
      return { error: "A fila está vazia ou todos já foram atendidos!" };
    }

    // 3. Prepara o envio para o n8n
    const webhookUrl = "https://n8n-n8n.yyuhkk.easypanel.host/webhook/disparo-encaixe";
    const formattedPhone = formatPhoneForWhatsapp(nextEntry.patient.phone);

    // Dispara o Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waitlistId,
        patientId: nextEntry.patient.id,
        patientName: nextEntry.patient.name,
        phone: formattedPhone,
        slotTime: slotTime,
        slotId: slotId || null
      })
    });

    if (!response.ok) {
      console.error("Falha no webhook n8n:", await response.text());
      return { error: "Erro ao conectar com o serviço de mensagens." };
    }

    // 4. Atualiza o banco de dados
    await prisma.$transaction([
      // Marca paciente como NOTIFICADO (para não chamar o mesmo 2x)
      prisma.waitlistEntry.update({
        where: { id: nextEntry.id },
        data: { 
          status: 'NOTIFIED',
          updatedAt: new Date()
        }
      }),
      // Incrementa contador de uso do médico
      prisma.user.update({
        where: { id: owner.id },
        data: { messagesSent: { increment: 1 } }
      })
    ]);

    return { 
      success: true, 
      patient: nextEntry.patient // Retorna dados para a Silvia usar na resposta
    };

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

export async function deleteWaitlist(waitlistId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    // 1. Verifica se a lista pertence ao usuário
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { owner: true }
    });

    if (!waitlist) return { error: "Lista não encontrada" };
    if (waitlist.owner.email !== session.user.email) {
      return { error: "Você não tem permissão para excluir esta lista." };
    }

    // 2. Deleta (o cascade do Prisma deve limpar as entries automaticamente se configurado,
    // mas por segurança o delete da Waitlist já é suficiente)
    await prisma.waitlist.delete({
      where: { id: waitlistId }
    });

    revalidatePath('/dashboard/waitlists');
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar lista:", error);
    return { error: "Erro ao excluir a lista. Tente novamente." };
  }
}

export async function getWaitlistsOptions() {
  const session = await auth();
  if (!session?.user?.email) return [];

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return [];

    const waitlists = await prisma.waitlist.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' }
    });
    return waitlists;
  } catch (error) {
    return [];
  }
}

export async function getWaitlists() {
  const session = await auth();
  if (!session?.user?.email) return [];

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return [];

    const waitlists = await prisma.waitlist.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    return waitlists;
  } catch (error) {
    console.error("Erro ao buscar listas:", error);
    return [];
  }
}