import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para Criar
const CreateSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const apiKey = req.headers.get('x-api-key');

  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const waitlists = await prisma.waitlist.findMany({
    where: { ownerId: userId, isActive: true },
    include: { _count: { select: { entries: true } } }
  });

  return NextResponse.json(waitlists);
}

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, name, description } = CreateSchema.parse(body);

    const newList = await prisma.waitlist.create({
      data: {
        ownerId: userId,
        name,
        description,
      }
    });
    return NextResponse.json({ success: true, waitlist: newList });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar lista' }, { status: 400 });
  }
}