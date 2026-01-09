import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConfirmSchema = z.object({
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
  slotId: z.string().optional().nullable(), // NOVO: ID do slot para reservar
});

export async function POST(request: Request) {
  try {
    // 1. Segurança
    const apiKey = request.headers.get('x-api-secret');
    if (process.env.N8N_API_SECRET && apiKey !== process.env.N8N_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = ConfirmSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { waitlistId, patientId, slotId } = validated.data;

    // 2. Transação de Confirmação
    const result = await prisma.$transaction(async (tx) => {
      // A. Busca a entrada
      const entry = await tx.waitlistEntry.findFirst({
        where: { waitlistId, patientId }
      });

      if (!entry) throw new Error('NOT_FOUND');

      // B. Validações de Status
      if (entry.status === 'CONFIRMED') return { status: 'ALREADY_DONE' };
      if (entry.status === 'EXPIRED') throw new Error('EXPIRED');
      if (entry.status === 'DECLINED') throw new Error('DECLINED');

      // C. Verifica Conflito na Lista
      const winner = await tx.waitlistEntry.findFirst({
        where: {
          waitlistId,
          status: 'CONFIRMED',
          id: { not: entry.id }
        }
      });
      if (winner) throw new Error('TAKEN');

      // D. RESERVAR O SLOT (Se houver ID) - A MÁGICA ACONTECE AQUI
      if (slotId) {
        // Verifica se o slot ainda está livre antes de confirmar
        const slot = await tx.agendaSlot.findUnique({ where: { id: slotId } });
        
        if (!slot) {
           // Se o slot sumiu (deletado), não impede a confirmação na lista, mas loga erro
           console.warn(`Slot ${slotId} não encontrado durante confirmação.`);
        } else if (slot.isBooked) {
           // Se já foi reservado (ex: importado e ocupado por outro meio), conflito!
           throw new Error('SLOT_TAKEN');
        } else {
           // Marca como ocupado na agenda
           await tx.agendaSlot.update({
             where: { id: slotId },
             data: { isBooked: true }
           });
        }
      }

      // E. Confirma na Lista de Espera
      await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: 'CONFIRMED', updatedAt: new Date() }
      });

      // F. Pausa a lista (opcional, dependendo da regra de negócio)
      // await tx.waitlist.update({ where: { id: waitlistId }, data: { isActive: false } });

      return { status: 'SUCCESS' };
    });

    // 3. Respostas
    if (result.status === 'ALREADY_DONE') {
      return NextResponse.json({ success: true, message: 'Já confirmado.' });
    }

    return NextResponse.json({ success: true, message: 'Confirmado e agendado!' });

  } catch (error: any) {
    console.error('Erro confirm:', error.message);
    switch (error.message) {
      case 'NOT_FOUND': return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
      case 'EXPIRED': return NextResponse.json({ error: 'Tempo esgotado.' }, { status: 410 });
      case 'DECLINED': return NextResponse.json({ error: 'Recusado anteriormente.' }, { status: 400 });
      case 'TAKEN': return NextResponse.json({ error: 'Lista já preenchida.' }, { status: 409 });
      case 'SLOT_TAKEN': return NextResponse.json({ error: 'Horário acabou de ser ocupado.' }, { status: 409 });
      default: return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
  }
}