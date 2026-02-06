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
    const { userId, slotId, patientId } = BookSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });

    // --- CENÁRIO 1: Agendamento Externo (Clinic) ---
    if (slotId.startsWith('clinic_')) {
      const isoDate = slotId.replace('clinic_', '');
      const date = new Date(isoDate);

      // 1. Tenta agendar na API da Clínica
      // A função createBooking já envia os dados do paciente. 
      // Se ele não existir lá, o CRM geralmente cria ou usa os dados enviados.
      await clinicService.createBooking(date, {
        name: patient.name,
        phone: patient.phone,
        birthDate: patient.birthDate
      });

      // 2. SUCESSO! Agora criamos o espelho no banco LOCAL (Encaixe Já)
      // Isso satisfaz sua regra: "registrar no banco de dados com slot igual ao do clinic"
      await prisma.agendaSlot.create({
        data: {
          userId,
          startTime: date,
          endTime: new Date(date.getTime() + 30 * 60000), // +30 min
          isBooked: true,
          patientId: patient.id,
          notes: "Agendado via Integração Clinic (Silvia)"
        }
      });

      return NextResponse.json({
        success: true,
        message: `Confirmado! Agendei ${patient.name} para ${date.toLocaleString('pt-BR')} no sistema da Clínica. ✅`
      });
    }

    // --- CENÁRIO 2: Agendamento Interno (Manual) ---
    else {
      const slot = await prisma.agendaSlot.findUnique({ where: { id: slotId } });
      
      if (!slot || slot.isBooked) {
        return NextResponse.json({ error: 'Este horário não está mais disponível.' }, { status: 409 });
      }

      await prisma.agendaSlot.update({
        where: { id: slotId },
        data: { isBooked: true, patientId: patient.id }
      });

      return NextResponse.json({
        success: true,
        message: `Agendamento interno confirmado para ${slot.startTime.toLocaleString('pt-BR')}. ✅`
      });
    }

  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar agendamento' }, { status: 400 });
  }
}