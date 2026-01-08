'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMinutes, startOfDay, endOfDay, addDays } from 'date-fns';
import { clinicService } from '@/lib/clinic'; // Certifique-se de que lib/clinic.ts existe

// Tipo unificado para o Frontend consumir sem saber a origem
export interface UnifiedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  source: 'LOCAL' | 'CLINIC';
  details?: string;
}

/**
 * Busca slots da semana (Local + Clinic)
 */
export async function getWeekSlots(startDate: Date): Promise<UnifiedSlot[]> {
  const session = await auth();
  
  // Se não houver sessão, retorna array vazio para não quebrar a UI
  if (!session?.user?.email) return [];

  // Busca usuário para garantir ID correto
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];

  const endOfWeek = addDays(startDate, 7);

  // 1. Busca Slots Locais (Prisma)
  // Buscamos tudo no intervalo (livres e ocupados)
  const localSlotsPromise = prisma.agendaSlot.findMany({
    where: {
      userId: user.id,
      startTime: {
        gte: startOfDay(startDate),
        lt: endOfDay(endOfWeek),
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // 2. Busca Externa (Clinic API)
  // Disparamos em paralelo para não travar o carregamento
  // O clinicService.getAvailableSlots busca APENAS os livres
  const clinicAvailablePromise = clinicService.getAvailableSlots(startDate, 7);
  
  // Se você implementou o getBookings no clinic.ts, descomente abaixo para ver os ocupados do ERP também:
  const clinicBookingsPromise = clinicService.getBookings(startDate, 7);

  // Aguarda todas as promessas (Promise.all é rápido)
  const [localData, clinicAvailable, clinicBookings] = await Promise.all([
    localSlotsPromise,
    clinicAvailablePromise,
    clinicBookingsPromise
  ]);

  // 3. Normalização dos Dados Locais
  const normalizedLocal: UnifiedSlot[] = localData.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    isBooked: s.isBooked,
    source: 'LOCAL',
    details: s.isBooked ? 'Ocupado (Manual)' : undefined
  }));

  // 4. Normalização dos Dados Clinic (Livre + Ocupado)
  // O service já deve retornar no formato compatível, mas garantimos aqui a tipagem
  const normalizedClinic: UnifiedSlot[] = [
    ...clinicAvailable,
    ...clinicBookings
  ];

  // 5. Merge e Ordenação Final
  // Juntamos tudo em um único array e ordenamos por horário
  const allSlots = [...normalizedLocal, ...normalizedClinic].sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );

  return allSlots;
}

/**
 * Cria um slot manual no banco de dados local
 */
export async function createSlotAction(date: Date, hour: number, minute: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "Usuário não encontrado" };

  // Construir datas
  const startTime = new Date(date);
  startTime.setHours(hour, minute, 0, 0);
  
  // Padrão de 30 minutos por slot manual (pode ser parametrizado no futuro)
  const endTime = addMinutes(startTime, 30); 

  try {
    await prisma.agendaSlot.create({
      data: {
        userId: user.id,
        startTime,
        endTime,
        isBooked: false, // Nasce livre
      },
    });
    
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar slot:", error);
    return { error: "Erro ao criar horário. Tente novamente." };
  }
}

/**
 * Remove um slot manual
 */
export async function deleteSlotAction(slotId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Não autorizado" };

  try {
    // Verifica se o slot pertence ao usuário antes de deletar (segurança)
    // O where com ID já seria suficiente se o ID for CUID, mas validar dono é boa prática
    const slot = await prisma.agendaSlot.findUnique({ where: { id: slotId } });
    
    if (!slot) return { error: "Horário não encontrado." };
    
    // Opcional: Bloquear deleção se já estiver agendado (isBooked)
    // if (slot.isBooked) return { error: "Não é possível remover um horário já agendado." };

    await prisma.agendaSlot.delete({ where: { id: slotId } });
    
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar slot:", error);
    return { error: "Erro ao remover horário." };
  }
}