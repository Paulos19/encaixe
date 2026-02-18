import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO, addDays } from 'date-fns';

const QuerySchema = z.object({
  userId: z.string().cuid(), // Identificador do Manager (Dono da agenda)
  date: z.string().optional(),
  days: z.coerce.number().optional().default(7),
});

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    
    // Normaliza: N8N pode mandar userId ou managerId, ambos representam o ID do User
    const userIdInput = searchParams.get('userId') || searchParams.get('managerId');
    if (!userIdInput) return NextResponse.json({ error: 'Missing userId/managerId' }, { status: 400 });

    const params = QuerySchema.parse({
      userId: userIdInput,
      date: searchParams.get('date'),
      days: searchParams.get('days'),
    });

    // 1. Definição de Datas
    let startDate = params.date ? parseISO(params.date) : new Date();
    const currentYear = new Date().getFullYear();

    if (startDate.getFullYear() < currentYear) {
      startDate.setFullYear(currentYear);
    }

    const endDate = addDays(startDate, params.days);
    
    console.log(`🤖 Silvia Consultando: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`);

    // 2. Busca Slots LOCAIS (Banco Prisma)
    // CORREÇÃO AQUI: Usando 'userId' conforme seu schema.prisma
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
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { plan: true } });
    let clinicSlots: any[] = [];
    
    if (user?.plan === 'PLUS') {
        try {
            clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);
        } catch (err) {
            console.error("⚠️ Erro ao buscar Clinic slots (Ignorando):", err);
        }
    }

    // 4. MERGE e UNIFICAÇÃO
    const slotMap = new Map<string, any>();

    // A. Popula com Manuais Locais
    manualSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      slotMap.set(key, {
        slotId: slot.id,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'LOCAL'
      });
    });

    // B. Mescla com Clinic
    clinicSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      const clinicSlotId = slot.id.startsWith('clinic-') ? slot.id : `clinic-${key}`;
      
      slotMap.set(key, {
        slotId: clinicSlotId,
        startTime: slot.startTime,
        horario: slot.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: slot.startTime.toLocaleDateString('pt-BR'),
        origem: 'CLINICA'
      });
    });

    // 5. Ordenação e Retorno
    const finalSlots = Array.from(slotMap.values())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(({ startTime, ...rest }) => rest);

    if (finalSlots.length === 0) {
      return NextResponse.json({ 
        message: `Nenhum horário livre encontrado entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`,
        slots: [] 
      });
    }

    return NextResponse.json({
      total: finalSlots.length,
      periodo: `${params.days} dias`,
      slots: finalSlots.slice(0, 50)
    });

  } catch (error: any) {
    console.error("❌ ERRO CRÍTICO NA ROTA SLOTS:", error.message);
    return NextResponse.json({ 
      error: error.message || "Erro desconhecido ao consultar agenda."
    }, { status: 500 });
  }
}