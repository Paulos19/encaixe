import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validação dos Query Params
const QuerySchema = z.object({
  userId: z.string().cuid(),
  limit: z.coerce.number().min(1).max(20).default(5),
});

export async function GET(req: Request) {
  // 1. Segurança: Verifica API Key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse da URL
    const { searchParams } = new URL(req.url);
    const params = QuerySchema.parse({
      userId: searchParams.get('userId'),
      limit: searchParams.get('limit'),
    });

    // 3. Query Segura no Prisma
    const slots = await prisma.agendaSlot.findMany({
      where: {
        userId: params.userId,
        isBooked: false,
        startTime: { gt: new Date() }, // Apenas futuro
      },
      orderBy: { startTime: 'asc' },
      take: params.limit,
      select: {
        id: true,
        startTime: true,
        endTime: true,
      }
    });

    // 4. Formatação amigável para a IA ler
    const formatted = slots.map(slot => ({
      id: slot.id,
      horario: new Date(slot.startTime).toLocaleString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vagas', details: String(error) }, { status: 400 });
  }
}