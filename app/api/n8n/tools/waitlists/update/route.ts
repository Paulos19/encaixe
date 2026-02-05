import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateListSchema = z.object({
  userId: z.string().cuid(),
  waitlistId: z.string().cuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, waitlistId, name, description } = UpdateListSchema.parse(body);

    // Verifica se a lista existe e pertence ao usuário
    const existing = await prisma.waitlist.findUnique({
      where: { id: waitlistId }
    });

    if (!existing || existing.ownerId !== userId) {
      return NextResponse.json({ error: 'Lista não encontrada ou acesso negado' }, { status: 404 });
    }

    const updatedList = await prisma.waitlist.update({
      where: { id: waitlistId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }), // Permite limpar descrição se enviar string vazia
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Lista atualizada para "${updatedList.name}".`,
      waitlist: updatedList 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar lista' }, { status: 400 });
  }
}