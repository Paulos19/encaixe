import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCustomEmail } from '@/lib/mail';
import { z } from 'zod';

const EmailSchema = z.object({
  userId: z.string().cuid(),
  patientId: z.string().cuid(),
  subject: z.string().min(1),
  body: z.string().min(1), // HTML ou Texto
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, patientId, subject, body: content } = EmailSchema.parse(body);

    // Valida paciente e pega o email
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.managerId !== userId) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    if (!patient.email) {
      return NextResponse.json({ error: `O paciente ${patient.name} não possui e-mail cadastrado.` }, { status: 400 });
    }

    await sendCustomEmail(patient.email, subject, content);

    return NextResponse.json({ success: true, message: `Email enviado para ${patient.email}` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao enviar email' }, { status: 400 });
  }
}