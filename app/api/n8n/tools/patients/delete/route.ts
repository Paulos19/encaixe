import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteSchema = z.object({
  userId: z.string().cuid(),
  patientId: z.string().cuid(),
});

export async function POST(req: Request) { // Usando POST para facilitar o body no n8n, mas poderia ser DELETE
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, patientId } = DeleteSchema.parse(body);

    // Verifica propriedade antes de deletar
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.managerId !== userId) {
      return NextResponse.json({ error: "Paciente não encontrado ou acesso negado." }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id: patientId }
    });

    return NextResponse.json({ success: true, message: "Paciente removido com sucesso." });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 400 });
  }
}