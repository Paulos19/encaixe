import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email().optional().or(z.literal('')),
  insurance: z.string().optional(),
  notes: z.string().optional(),
  // NOVO: Aceita string e converte para Date. Opcional.
  birthDate: z.coerce.date().optional(), 
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    // Verifica duplicidade
    const existing = await prisma.patient.findUnique({
      where: {
        managerId_phone: {
          managerId: data.userId,
          phone: data.phone
        }
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: "Já existe um paciente cadastrado com este telefone.",
        patientId: existing.id 
      }, { status: 409 });
    }

    const newPatient = await prisma.patient.create({
      data: {
        managerId: data.userId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        insurance: data.insurance,
        notes: data.notes,
        birthDate: data.birthDate, // Adicionado
      }
    });

    return NextResponse.json({ success: true, patient: newPatient });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar paciente' }, { status: 400 });
  }
}