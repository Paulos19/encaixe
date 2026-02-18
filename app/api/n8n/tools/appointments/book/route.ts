import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';

const BookSchema = z.object({
  userId: z.string().cuid(), 
  slotId: z.string().min(1),
  patientId: z.string().cuid(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    
    // Normalização: mapeia 'managerId' vindo do N8N para 'userId' usado no schema
    const payload = {
        userId: body.userId || body.managerId,
        slotId: body.slotId,
        patientId: body.patientId
    };

    const { userId, slotId, patientId } = BookSchema.parse(payload);

    // Buscar Paciente Local
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });

    // --- CENÁRIO 1: Agendamento Externo (Clinic) ---
    if (slotId.startsWith('clinic-') || slotId.startsWith('clinic_')) {
      console.log(`🏥 Iniciando agendamento Clinic para ${patient.name} no slot ${slotId}`);

      const isoDate = slotId.replace(/^clinic[-_](free[-_])?/, '');
      const date = new Date(isoDate);

      if (isNaN(date.getTime())) {
          throw new Error(`Data inválida extraída do slotId: ${slotId}`);
      }

      // 1. Agendar na API Legada
      const clinicResult = await clinicService.createBooking(date, {
        name: patient.name,
        phone: patient.phone,
        birthDate: patient.birthDate
      });

      // 2. Criar espelho local
      // CORREÇÃO AQUI: Usando 'userId' ao invés de 'managerId'
      const localMirrorSlot = await prisma.agendaSlot.create({
        data: {
          userId: userId, // Corrigido
          startTime: date,
          endTime: new Date(date.getTime() + 30 * 60000), 
          isBooked: true,
          patientId: patient.id,
          notes: `Agendado via Integração Clinic (ID Externo: ${clinicResult.bookingId})`
        }
      });

      return NextResponse.json({
        success: true,
        message: `Confirmado! Agendamento realizado na Clínica para ${date.toLocaleString('pt-BR')}.`,
        appointment: localMirrorSlot,
        clinicId: clinicResult.bookingId
      });
    }

    // --- CENÁRIO 2: Agendamento Interno (Manual) ---
    else {
      const slot = await prisma.agendaSlot.findUnique({ where: { id: slotId } });
      
      if (!slot) return NextResponse.json({ error: 'Slot não encontrado.' }, { status: 404 });
      if (slot.isBooked) return NextResponse.json({ error: 'Este horário já foi ocupado.' }, { status: 409 });

      const updatedSlot = await prisma.agendaSlot.update({
        where: { id: slotId },
        data: { isBooked: true, patientId: patient.id }
      });

      return NextResponse.json({
        success: true,
        message: `Agendamento interno confirmado para ${slot.startTime.toLocaleString('pt-BR')}.`,
        appointment: updatedSlot
      });
    }

  } catch (error: any) {
    console.error("❌ Booking Error:", error);
    return NextResponse.json({ 
        error: error.message || 'Erro ao processar agendamento.' 
    }, { status: 500 });
  }
}