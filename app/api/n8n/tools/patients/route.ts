import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const QuerySchema = z.object({
  userId: z.string().cuid(),
  search: z.string().min(1),
});

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = QuerySchema.parse({
      userId: searchParams.get('userId'),
      search: searchParams.get('search'),
    });

    const patients = await prisma.patient.findMany({
      where: {
        managerId: params.userId,
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search } },
        ]
      },
      take: 3, // Limita para não estourar contexto da IA
      select: {
        id: true,
        name: true,
        phone: true,
        insurance: true,
      }
    });

    return NextResponse.json(patients);

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar paciente' }, { status: 400 });
  }
}