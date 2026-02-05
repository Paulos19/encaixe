import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ManageSchema = z.object({
  userId: z.string().cuid(),
  entryId: z.string().cuid(), // ID da entrada na fila (NÃO do paciente)
  action: z.enum(['DELETE', 'MOVE_LAST', 'CHANGE_STATUS']),
  newStatus: z.enum(['WAITING', 'NOTIFIED', 'CONFIRMED', 'DECLINED', 'CANCELED']).optional(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, entryId, action, newStatus } = ManageSchema.parse(body);

    // Verifica propriedade através da Waitlist
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: entryId },
      include: { waitlist: true, patient: true }
    });

    if (!entry || entry.waitlist.ownerId !== userId) {
      return NextResponse.json({ error: 'Item não encontrado ou acesso negado' }, { status: 404 });
    }

    let result;
    let message = "";

    switch (action) {
      case 'DELETE':
        await prisma.waitlistEntry.delete({ where: { id: entryId } });
        message = "Paciente removido da fila.";
        break;

      case 'MOVE_LAST':
        // Atualiza a data de entrada para AGORA, jogando ele pro fim da ordenação por data
        result = await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: { addedAt: new Date() }
        });
        message = "Paciente movido para o final da fila.";
        break;

      case 'CHANGE_STATUS':
        if (!newStatus) throw new Error("Status novo obrigatório");
        result = await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: { status: newStatus }
        });
        message = `Status alterado para ${newStatus}.`;
        break;
    }

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerenciar fila' }, { status: 400 });
  }
}