import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO, addDays } from 'date-fns';

const QuerySchema = z.object({
  userId: z.string().cuid(),
  date: z.string().optional(),
  days: z.coerce.number().optional().default(7),
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

    const startDate = params.date ? parseISO(params.date) : new Date();
    const endDate = addDays(startDate, params.days);
    
    console.log(`🤖 Silvia Consultando: De ${startDate.toISOString()} até ${endDate.toISOString()} (${params.days} dias)`);

    // 1. Busca Slots MANUAIS
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

    // 2. Busca Slots CLINIC
    let clinicSlots: any[] = [];
    try {
      clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);
    } catch (e: any) {
      console.error("⚠️ Falha ao buscar Clinic Slots:", e.message);
      // Se quiser que a Silvia avise do erro, descomente abaixo. 
      // Se preferir que ela mostre só os manuais mesmo com erro no clinic, mantenha o catch silencioso (apenas log).
      // return NextResponse.json({ error: "Erro de comunicação com a agenda da Clínica. Tente novamente." }, { status: 502 });
    }

    // 3. MERGE
    const slotMap = new Map<string, any>();

    manualSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: slot.id,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'MANUAL'
      });
    });

    clinicSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: `clinic_${key}`,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'CLINICA'
      });
    });

    const finalSlots = Array.from(slotMap.values())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(({ startTime, ...rest }) => rest);

    console.log(`📊 Total Slots Encontrados: ${finalSlots.length} (Clinic: ${clinicSlots.length}, Manual: ${manualSlots.length})`);

    if (finalSlots.length === 0) {
      return NextResponse.json({ 
        message: `Nenhum horário livre encontrado entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`,
        horarios_disponiveis: [] 
      });
    }

    return NextResponse.json({
      total: finalSlots.length,
      periodo: `${params.days} dias`,
      horarios_disponiveis: finalSlots.slice(0, 30) // Aumentei para 30 para cobrir mais opções
    });

  } catch (error: any) {
    console.error("Erro Slots Route:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}