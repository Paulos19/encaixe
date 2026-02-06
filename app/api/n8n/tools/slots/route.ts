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

    // 1. Definição de Datas
    let startDate = params.date ? parseISO(params.date) : new Date();
    const currentYear = new Date().getFullYear();

    // Correção automática de ano (evita 2024 quando estamos em 2026)
    if (startDate.getFullYear() < currentYear) {
      console.warn(`⚠️ Data antiga detectada (${startDate.getFullYear()}). Corrigindo para ${currentYear}.`);
      startDate.setFullYear(currentYear);
    }

    const endDate = addDays(startDate, params.days);
    
    console.log(`🤖 Silvia Consultando: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')} (${params.days} dias)`);

    // 2. Busca Slots MANUAIS (Banco Local)
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

    // 3. Busca Slots CLINIC (API Externa)
    // REMOVIDO O TRY/CATCH SILENCIOSO: Se der erro aqui, queremos ver o erro!
    const clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);

    // 4. MERGE (Clinic tem preferência)
    const slotMap = new Map<string, any>();

    // A. Popula Manuais
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

    // B. Sobrescreve com Clinic (se houver colisão, Clinic vence)
    clinicSlots.forEach((slot: { startTime: { toISOString: () => any; toLocaleTimeString: (arg0: string, arg1: { hour: string; minute: string; }) => any; toLocaleDateString: (arg0: string) => any; }; }) => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: `clinic_${key}`,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'CLINICA'
      });
    });

    // Ordenação e Limpeza
    const finalSlots = Array.from(slotMap.values())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(({ startTime, ...rest }) => rest);

    console.log(`📊 Resultado Final: ${finalSlots.length} slots encontrados.`);

    if (finalSlots.length === 0) {
      return NextResponse.json({ 
        message: `Nenhum horário livre encontrado entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`,
        horarios_disponiveis: [] 
      });
    }

    return NextResponse.json({
      total: finalSlots.length,
      periodo: `${params.days} dias`,
      horarios_disponiveis: finalSlots.slice(0, 30) // Retorna até 30 opções
    });

  } catch (error: any) {
    console.error("❌ ERRO CRÍTICO NA ROTA SLOTS:", error.message);
    // Retorna o erro detalhado para a Silvia/N8N
    return NextResponse.json({ 
      error: error.message || "Erro desconhecido ao consultar agenda."
    }, { status: 500 });
  }
}