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
});

// --- ACTIONS PÚBLICAS (CHAMADAS PELO FRONTEND) ---

export async function createWaitlist(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "Não autorizado" };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = CreateWaitlistSchema.safeParse(data);

  if (!validated.success) {
    return { error: "Dados inválidos" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

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
    console.error(error);
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

  // Chama a lógica compartilhada
  const result = await findAndNotifyNextPatient(
    validated.data.waitlistId,
    validated.data.slotTime
  );

  if (result.success) {
    revalidatePath(`/dashboard/waitlists/${validated.data.waitlistId}`);
    return { success: true, message: "Disparo iniciado para o próximo paciente!" };
  } else {
    return { error: result.error };
  }
}

// --- LÓGICA COMPARTILHADA (CORE DO SISTEMA) ---
// Exportada para ser usada também pelo Webhook de Decline/Expire
export async function findAndNotifyNextPatient(waitlistId: string, slotTime: string) {
  try {
    // 1. Validar a Lista e o Dono (Limites de Plano)
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { owner: true }
    });

    if (!waitlist) return { error: "Lista não encontrada" };

    const owner = waitlist.owner;
    
    // Verificação de Limites (Billing)
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

    // 3. Disparar para o n8n (Webhook de Disparo)
    const n8nUrl = process.env.N8N_WEBHOOK_URL; // Defina isso no .env
    
    if (!n8nUrl) {
      console.error("N8N_WEBHOOK_URL não definida");
      return { error: "Erro de configuração do servidor" };
    }

    // Disparo assíncrono (não travamos o banco esperando o n8n)
    // Importante: Enviamos slotTime para o n8n passar para o Redis
    await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waitlistId,
        patientId: nextEntry.patient.id,
        patientName: nextEntry.patient.name,
        phone: nextEntry.patient.phone,
        slotTime: slotTime
      })
    });

    // 4. Atualizar Estado no Banco
    // Marcamos como NOTIFIED para ele não ser pego na próxima query
    // Incrementamos o uso do dono da clínica
    await prisma.$transaction([
      prisma.waitlistEntry.update({
        where: { id: nextEntry.id },
        data: { 
          status: 'NOTIFIED',
          updatedAt: new Date()
        }
      }),
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