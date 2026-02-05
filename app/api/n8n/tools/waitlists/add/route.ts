import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddSchema = z.object({
  userId: z.string().cuid(),
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, waitlistId, patientId } = AddSchema.parse(body);

    // Verifica se já está na lista
    const existing = await prisma.waitlistEntry.findFirst({
      where: { waitlistId, patientId, status: 'WAITING' }
    });

    if (existing) return NextResponse.json({ error: 'Paciente já está nesta fila.' });

    const entry = await prisma.waitlistEntry.create({
      data: {
        waitlistId,
        patientId,
        status: 'WAITING',
        addedAt: new Date(), // Garante que entra no final da fila (data atual)
      },
      include: { patient: true, waitlist: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: `${entry.patient.name} adicionado à lista "${entry.waitlist.name}".` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao adicionar na fila' }, { status: 400 });
  }
}