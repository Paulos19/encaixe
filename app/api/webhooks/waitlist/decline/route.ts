import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeclineSchema = z.object({
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
  reason: z.string().optional(),
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

    const { waitlistId, patientId } = validated.data;

    // 2. Buscar a entrada
    const entry = await prisma.waitlistEntry.findFirst({
        where: { waitlistId, patientId }
    });

    if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // 3. Atualizar status
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: 'DECLINED', // Marca como recusado
        updatedAt: new Date()
      }
    });

    // 4. Lógica Futura: Aqui poderíamos retornar o ID do PRÓXIMO paciente da fila
    // para que o n8n já dispare a mensagem para ele.
    // Por enquanto, apenas confirmamos o recebimento.

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}