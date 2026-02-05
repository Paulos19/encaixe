import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TriggerSchema = z.object({
  userId: z.string().cuid(),
  waitlistId: z.string().cuid(),
  slotTime: z.string().min(1, "O horário é obrigatório"), // Ex: "Amanhã 14h" ou ISO
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, waitlistId, slotTime } = TriggerSchema.parse(body);

    // 1. Valida a Lista
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { 
        // Pega o PRIMEIRO da fila que ainda está esperando
        entries: {
          where: { status: 'WAITING' },
          orderBy: { addedAt: 'asc' }, // FIFO (Primeiro que entrou é o primeiro a receber)
          take: 1,
          include: { patient: true }
        }
      }
    });

    if (!waitlist || waitlist.ownerId !== userId) {
      return NextResponse.json({ error: 'Lista não encontrada.' }, { status: 404 });
    }

    if (waitlist.entries.length === 0) {
      return NextResponse.json({ 
        result: 'fila_vazia',
        message: `A lista "${waitlist.name}" está vazia ou todos já foram atendidos.` 
      });
    }

    const nextEntry = waitlist.entries[0];
    const patient = nextEntry.patient;

    // 2. Atualiza Status para NOTIFIED (Bloqueia para outros não pegarem)
    // Aqui assumimos que o n8n ou outro webhook vai efetivamente mandar o WhatsApp
    await prisma.waitlistEntry.update({
      where: { id: nextEntry.id },
      data: { 
        status: 'NOTIFIED',
        updatedAt: new Date()
      }
    });

    // 3. Retorna sucesso para a Silvia contar a novidade
    return NextResponse.json({
      success: true,
      message: `Disparo realizado com sucesso!`,
      details: {
        paciente: patient.name,
        telefone: patient.phone,
        horario_oferta: slotTime,
        lista: waitlist.name
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao disparar lista' }, { status: 400 });
  }
}