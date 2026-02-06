import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSchema = z.object({
  userId: z.string().cuid(),
  patientId: z.string().cuid(),
  data: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    insurance: z.string().optional(),
    notes: z.string().optional(),
    // NOVO: Coerção de data na edição também
    birthDate: z.coerce.date().optional(),
  })
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, patientId, data } = UpdateSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.managerId !== userId) {
      return NextResponse.json({ error: 'Paciente não encontrado ou acesso negado' }, { status: 404 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...data,
        // Remove campos undefined para não sobrescrever com null se não forem enviados
        birthDate: data.birthDate === undefined ? undefined : data.birthDate,
      }
    });

    return NextResponse.json({ success: true, patient: updatedPatient });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar paciente' }, { status: 400 });
  }
}