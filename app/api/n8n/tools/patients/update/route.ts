import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSchema = z.object({
  userId: z.string().cuid(), // Quem está pedindo (segurança)
  patientId: z.string().cuid(),
  data: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    insurance: z.string().optional(),
    notes: z.string().optional(),
  })
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, patientId, data } = UpdateSchema.parse(body);

    // Verifica se o paciente pertence ao médico antes de editar
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId, managerId: userId }
    });

    if (!existingPatient) {
      return NextResponse.json({ error: 'Paciente não encontrado ou acesso negado' }, { status: 404 });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...data, // Atualiza apenas os campos enviados
      }
    });

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 400 });
  }
}