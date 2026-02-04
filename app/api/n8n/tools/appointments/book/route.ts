import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BookSchema = z.object({
  userId: z.string().cuid(),
  slotId: z.string().cuid(),
  patientId: z.string().cuid(),
});

export async function POST(req: Request) {
  // 1. Verificação de Segurança (API Key)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 2. Validação dos dados de entrada
    const { userId, slotId, patientId } = BookSchema.parse(body);

    // 3. Transação Atômica: Garante que verificamos e agendamos "ao mesmo tempo"
    const appointment = await prisma.$transaction(async (tx) => {
      
      // A. Verifica o Slot
      const slot = await tx.agendaSlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) throw new Error("Horário não encontrado.");
      if (slot.userId !== userId) throw new Error("Este horário pertence a outro médico.");
      if (slot.isBooked) throw new Error("Este horário já foi preenchido/agendado.");

      // B. Verifica o Paciente
      const patient = await tx.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) throw new Error("Paciente não encontrado.");
      if (patient.managerId !== userId) throw new Error("Paciente não pertence à sua carteira.");

      // C. Executa o Agendamento
      const updatedSlot = await tx.agendaSlot.update({
        where: { id: slotId },
        data: {
          isBooked: true,
          patientId: patientId, // <--- Aqui está o vínculo que faltava
        },
        include: {
          patient: {
            select: { name: true, phone: true }
          }
        }
      });

      return updatedSlot;
    });

    // 4. Retorno formatado para a IA entender
    return NextResponse.json({
      success: true,
      message: `Agendamento confirmado para ${appointment.patient?.name} no dia ${new Date(appointment.startTime).toLocaleString('pt-BR')}.`,
      details: {
        slotId: appointment.id,
        patient: appointment.patient?.name,
        time: appointment.startTime
      }
    });

  } catch (error: any) {
    console.error("[Booking Error]", error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar agendamento' }, 
      { status: 400 }
    );
  }
}