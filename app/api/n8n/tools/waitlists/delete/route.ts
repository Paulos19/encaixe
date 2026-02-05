import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteListSchema = z.object({
  userId: z.string().cuid(),
  waitlistId: z.string().cuid(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, waitlistId } = DeleteListSchema.parse(body);

    const existing = await prisma.waitlist.findUnique({
      where: { id: waitlistId }
    });

    if (!existing || existing.ownerId !== userId) {
      return NextResponse.json({ error: 'Lista não encontrada ou acesso negado' }, { status: 404 });
    }

    // Deleta a lista (e todas as entries em cascata)
    await prisma.waitlist.delete({
      where: { id: waitlistId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Lista "${existing.name}" foi excluída com sucesso.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir lista' }, { status: 400 });
  }
}