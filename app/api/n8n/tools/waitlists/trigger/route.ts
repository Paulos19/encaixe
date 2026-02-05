import { NextResponse } from 'next/server';
import { findAndNotifyNextPatient } from '@/app/actions/waitlist';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validação dos dados que a Silvia envia
const TriggerSchema = z.object({
  userId: z.string().cuid(),
  waitlistId: z.string().cuid(),
  slotTime: z.string().min(1, "O horário é obrigatório"),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, waitlistId, slotTime } = TriggerSchema.parse(body);

    // Valida propriedade da lista (Segurança)
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId }
    });

    if (!waitlist || waitlist.ownerId !== userId) {
      return NextResponse.json({ error: 'Lista não encontrada ou acesso negado.' }, { status: 404 });
    }

    // CHAMA A LÓGICA CENTRAL (A mesma do botão manual)
    const result = await findAndNotifyNextPatient(waitlistId, slotTime);

    if (result.error) {
      // Retorna erro amigável para a Silvia explicar
      return NextResponse.json({ 
        result: 'erro',
        message: result.error
      });
    }

    // Sucesso! Retorna detalhes para a Silvia contar a vitória
    const patient = result.patient;
    return NextResponse.json({
      success: true,
      message: `Disparo realizado com sucesso!`,
      details: {
        paciente: patient?.name,
        telefone: patient?.phone,
        horario_oferta: slotTime,
        lista: waitlist.name
      }
    });

  } catch (error: any) {
    console.error("Erro na Tool Trigger:", error);
    return NextResponse.json({ error: error.message || 'Erro ao disparar lista' }, { status: 400 });
  }
}