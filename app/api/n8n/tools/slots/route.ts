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
    const userIdInput = searchParams.get('userId') || searchParams.get('managerId');
    if (!userIdInput) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const params = QuerySchema.parse({
      userId: userIdInput,
      date: searchParams.get('date'),
      days: searchParams.get('days'),
    });

    // 1. Definição de Datas
    let startDate = params.date ? parseISO(params.date) : new Date();
    const currentYear = new Date().getFullYear();
    // Correção: Se a IA enviar 2024 ou 2025, ajustamos para o ano atual
    if (startDate.getFullYear() < currentYear) startDate.setFullYear(currentYear);
    const endDate = addDays(startDate, params.days);
    
    // DIAGNÓSTICO: Verificar se usuário é PLUS
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { plan: true, name: true } });
    const isPlus = user?.plan === 'PLUS';
    
    console.log(`🤖 Silvia Agenda | User: ${user?.name} | Plano: ${user?.plan} | Buscando: ${params.days} dias a partir de ${startDate.toLocaleDateString()}`);

    // 2. Busca Slots LOCAIS (Banco Prisma)
    const manualSlots = await prisma.agendaSlot.findMany({
      where: {
        userId: params.userId, 
        isBooked: false,
        startTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
      },
    });

    // 3. Busca Slots CLINIC (Se PLUS)
    let clinicSlots: any[] = [];
    if (isPlus) {
        try {
            // O serviço agora tenta rota direta E fallback por especialidade
            clinicSlots = await clinicService.getAvailableSlots(startDate, params.days);
        } catch (err) {
            console.error("⚠️ Erro Clinic:", err);
        }
    } else {
        console.warn("🚫 Usuário não é PLUS. Pulando busca na Clínica.");
    }

    // 4. Merge
    const slotMap = new Map<string, any>();

    // A. Manuais
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

    // B. Clinic
    clinicSlots.forEach(slot => {
      const key = slot.startTime.toISOString();
      // Garante ID único com prefixo para o POST
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

    console.log(`📊 Total Slots Retornados: ${finalSlots.length}`);

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
    console.error("❌ ERRO API SLOTS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}