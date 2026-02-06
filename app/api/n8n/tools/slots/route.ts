import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO, addDays } from 'date-fns';

const QuerySchema = z.object({
  userId: z.string().cuid(),
  date: z.string().optional(), // YYYY-MM-DD
  days: z.coerce.number().optional().default(7), // Padrão: buscar próxima semana
});

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = QuerySchema.parse({
      userId: searchParams.get('userId'),
      date: searchParams.get('date'),
      days: searchParams.get('days'),
    });

    // Se não passar data, usa hoje. Se passar, usa a data pedida.
    const startDate = params.date ? parseISO(params.date) : new Date();
    const endDate = addDays(startDate, params.days);
    
    // 1. Busca Slots MANUAIS (Banco Local)
    const manualSlots = await prisma.agendaSlot.findMany({
      where: {
        userId: params.userId,
        isBooked: false,
        startTime: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
    });

    // 2. Busca Slots CLINIC (API Externa)
    // Passamos a data inicial e quantos dias para frente queremos ver
    const clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);

    // 3. MERGE COM PREFERÊNCIA (Clinic > Manual)
    const slotMap = new Map<string, any>();

    // A. Manuais
    manualSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: slot.id,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'MANUAL' // O usuário verá que é um horário manual interno
      });
    });

    // B. Clinic (Sobrescreve se bater horário)
    clinicSlots.forEach((slot: { startTime: { toISOString: () => any; toLocaleTimeString: (arg0: string, arg1: { hour: string; minute: string; }) => any; toLocaleDateString: (arg0: string) => any; }; }) => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: `clinic_${key}`, // ID especial para o agendamento
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'CLINICA' // O usuário verá que é da Clínica
      });
    });

    // Ordena por data/hora
    const finalSlots = Array.from(slotMap.values())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(({ startTime, ...rest }) => rest); // Remove o objeto Date bruto para limpar o JSON

    if (finalSlots.length === 0) {
      return NextResponse.json({ 
        message: "Nenhum horário livre encontrado para o período solicitado.",
        horarios_disponiveis: [] 
      });
    }

    // Retorna todos (a Silvia que deve filtrar visualmente, mas limitamos a 20 para não estourar tokens)
    return NextResponse.json({
      total: finalSlots.length,
      periodo: `${params.days} dias`,
      horarios_disponiveis: finalSlots.slice(0, 20) 
    });

  } catch (error: any) {
    console.error("Erro Slots:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}