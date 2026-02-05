import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const waitlistId = searchParams.get('waitlistId');
  const apiKey = req.headers.get('x-api-key');

  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!waitlistId || !userId) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });

  // Busca a lista e os pacientes dentro dela, ordenados por chegada
  const list = await prisma.waitlist.findUnique({
    where: { id: waitlistId, ownerId: userId },
    include: {
      entries: {
        orderBy: { addedAt: 'asc' }, // FIFO: Primeiro a chegar aparece em cima
        include: {
          patient: { select: { id: true, name: true, phone: true, insurance: true } }
        }
      }
    }
  });

  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });

  // Formata para a IA entender fácil
  const formattedEntries = list.entries.map((entry, index) => ({
    posicao: index + 1,
    entryId: entry.id, // ID IMPORTANTE PARA EDICAO
    paciente: entry.patient.name,
    status: entry.status,
    tempo_espera: entry.addedAt,
    detalhes_paciente: entry.patient
  }));

  return NextResponse.json({ 
    lista: list.name, 
    total: list.entries.length,
    pacientes: formattedEntries 
  });
}