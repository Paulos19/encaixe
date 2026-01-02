'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema de validação dos dados recebidos do formulário
const TriggerSchema = z.object({
  waitlistId: z.string().cuid(),
  slotTime: z.string().min(1, "Horário é obrigatório"), // Ex: "14:30" ou "Amanhã 10h"
});

/**
 * Remove caracteres não numéricos do telefone.
 * Ex: "(41) 99999-8888" -> "41999998888"
 * Importante: O Evolution API espera o número limpo ou com @s.whatsapp.net,
 * mas como o n8n vai adicionar o sufixo, mandamos apenas os números aqui.
 */
function sanitizePhone(phone: string) {
  // Remove tudo que não for dígito
  let cleanNumber = phone.replace(/\D/g, '');
  
  // Opcional: Garantir DDI 55 se não tiver (assumindo operação BR)
  // Se o número tiver 10 ou 11 dígitos, adiciona 55
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  return cleanNumber;
}

export async function triggerSlot(formData: FormData) {
  // 1. Verificação de Autenticação
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Não autorizado. Faça login novamente." };
  }

  // 2. Validação dos Inputs
  const data = Object.fromEntries(formData.entries());
  const validated = TriggerSchema.safeParse(data);

  if (!validated.success) {
    return { error: "Horário inválido ou não informado." };
  }

  const { waitlistId, slotTime } = validated.data;

  try {
    // 3. Busca o próximo paciente da fila (Lógica FIFO)
    // Pega o paciente com status WAITING que entrou há mais tempo (addedAt asc)
    const nextEntry = await prisma.waitlistEntry.findFirst({
      where: {
        waitlistId: waitlistId,
        status: 'WAITING',
      },
      include: {
        patient: true
      },
      orderBy: {
        addedAt: 'asc' 
      }
    });

    if (!nextEntry) {
      return { error: "A fila está vazia! Adicione pacientes antes de disparar." };
    }

    // 4. Atualiza status para NOTIFIED
    // Isso impede que o mesmo paciente receba disparos duplicados se o botão for clicado 2x rápido
    await prisma.waitlistEntry.update({
      where: { id: nextEntry.id },
      data: { 
        status: 'NOTIFIED',
        updatedAt: new Date()
      }
    });

    // 5. Prepara os dados para o n8n
    const webhookUrl = 'https://n8n-n8n.qqfurw.easypanel.host/webhook/disparo-encaixe';
    const cleanPhone = sanitizePhone(nextEntry.patient.phone);

    const payload = {
      waitlistId: waitlistId,
      patientId: nextEntry.patient.id,
      phone: cleanPhone, // Envia apenas números (ex: 5541999998888)
      patientName: nextEntry.patient.name,
      slotTime: slotTime
    };

    // 6. Dispara o Webhook do n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro n8n:", errorText);
      
      // Opcional: Reverter o status se o envio falhar?
      // Por segurança, mantemos NOTIFIED para o humano verificar manualmente se a msg saiu,
      // evitando spam de mensagens se o erro for apenas de timeout de resposta.
      return { error: "Falha ao comunicar com o serviço de mensagens, mas o status foi atualizado." };
    }

    // 7. Atualiza a UI
    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    
    return { 
      success: true, 
      message: `Oferta de vaga enviada para ${nextEntry.patient.name}!` 
    };

  } catch (error) {
    console.error("Erro no Server Action triggerSlot:", error);
    return { error: "Erro interno ao processar disparo. Tente novamente." };
  }
}