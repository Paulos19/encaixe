import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { findAndNotifyNextPatient } from '@/app/actions/waitlist'; // Importamos a lógica

const DeclineSchema = z.object({
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
  reason: z.string().optional(),
  // Importante: O n8n precisa devolver o horário que estava sendo negociado
  // para podermos oferecer ao próximo.
  slotTime: z.string().optional(), 
});

export async function POST(request: Request) {
  try {
    // 1. Segurança
    const apiKey = request.headers.get('x-api-secret');
    if (apiKey !== process.env.N8N_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = DeclineSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { waitlistId, patientId, slotTime } = validated.data;

    // 2. Buscar a entrada
    const entry = await prisma.waitlistEntry.findFirst({
        where: { waitlistId, patientId }
    });

    if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // 3. Atualizar status para RECUSADO
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: 'DECLINED',
        updatedAt: new Date()
      }
    });

    console.log(`[WAITLIST] Paciente ${patientId} recusou. Buscando próximo...`);

    // 4. Lógica do Loop Infinito
    // Se tivermos o slotTime, chamamos o próximo da fila imediatamente.
    let nextPatientResult = null;
    
    if (slotTime) {
      nextPatientResult = await findAndNotifyNextPatient(waitlistId, slotTime);
    } else {
      console.warn("[WAITLIST] Loop interrompido: slotTime não fornecido pelo webhook.");
    }

    return NextResponse.json({ 
      success: true, 
      nextTriggered: nextPatientResult?.success || false 
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}