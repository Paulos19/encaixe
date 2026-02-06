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

    // 1. Definição da Data Base
    let startDate = params.date ? parseISO(params.date) : new Date();
    const currentYear = new Date().getFullYear();

    // --- CORREÇÃO DE ANO (FIX 2024 -> 2026) ---
    // Se a IA mandar um ano menor que o atual (ex: 2024), forçamos o ano corrente.
    // Isso corrige alucinações de data.
    if (startDate.getFullYear() < currentYear) {
      console.warn(`⚠️ Data antiga detectada (${startDate.getFullYear()}). Corrigindo para ${currentYear}.`);
      startDate.setFullYear(currentYear);
    }
    // ------------------------------------------

    const endDate = addDays(startDate, params.days);
    
    console.log(`🤖 Silvia Consultando: De ${startDate.toISOString()} até ${endDate.toISOString()} (${params.days} dias)`);

    // 2. Busca Slots MANUAIS
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

    // 3. Busca Slots CLINIC
    let clinicSlots: any[] = [];
    try {
      clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);
    } catch (e: any) {
      console.error("⚠️ Falha ao buscar Clinic Slots:", e.message);
    }

    // 4. MERGE
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

    console.log(`📊 Total Slots: ${finalSlots.length} (Corrigido para ${startDate.toLocaleDateString('pt-BR')})`);

    if (finalSlots.length === 0) {
      return NextResponse.json({ 
        message: `Nenhum horário livre encontrado entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`,
        horarios_disponiveis: [] 
      });
    }

    return NextResponse.json({
      total: finalSlots.length,
      periodo: `${params.days} dias`,
      data_inicio_considerada: startDate.toLocaleDateString('pt-BR'), // Informa a Silvia a data real usada
      horarios_disponiveis: finalSlots.slice(0, 30)
    });

  } catch (error: any) {
    console.error("Erro Slots Route:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}