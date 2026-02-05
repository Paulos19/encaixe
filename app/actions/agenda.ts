'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMinutes, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getClinicAvailableSlots, getClinicBookings } from '@/lib/clinic';

export interface UnifiedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  source: 'LOCAL' | 'CLINIC';
  details?: string;
}

// NOVA FUNÇÃO FLEXÍVEL
export async function getSlots(referenceDate: Date, view: 'week' | 'month' = 'week'): Promise<UnifiedSlot[]> {
  const session = await auth();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];

  let start: Date;
  let end: Date;

  if (view === 'month') {
    start = startOfMonth(referenceDate);
    end = endOfMonth(referenceDate);
  } else {
    // Default Week
    start = startOfWeek(referenceDate, { weekStartsOn: 0 }); // Domingo
    end = endOfWeek(referenceDate, { weekStartsOn: 0 });
  }

  // 1. Busca Local
  const localSlotsPromise = prisma.agendaSlot.findMany({
    where: {
      userId: user.id,
      startTime: { gte: start, lte: end },
    },
    orderBy: { startTime: 'asc' },
  });

  // 2. Busca Clinic (API) - Ajusta o range da busca externa
  const daysDiff = view === 'month' ? 35 : 7; // Mês busca ~35 dias, semana 7
  
  const clinicDataPromise = (async () => {
    try {
      const [available, bookings] = await Promise.all([
        getClinicAvailableSlots(start, daysDiff),
        getClinicBookings(start, daysDiff)
      ]);
      return [...available, ...bookings] as UnifiedSlot[];
    } catch (e) {
      console.error("Erro ao carregar dados do Clinic na Action:", e);
      return [];
    }
  })();

  const [localSlots, clinicSlots] = await Promise.all([localSlotsPromise, clinicDataPromise]);

  // 3. Normalização Local
  const normalizedLocal: UnifiedSlot[] = localSlots.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    isBooked: s.isBooked,
    source: 'LOCAL',
    details: s.isBooked ? 'Ocupado (Manual)' : undefined
  }));

  // 4. Merge e Ordenação
  return [...normalizedLocal, ...clinicSlots].sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );
}

// Mantenha a compatibilidade se algo ainda usar getWeekSlots
export async function getWeekSlots(date: Date) {
    return getSlots(date, 'week');
}

// ... (Mantenha as actions createSlotAction e deleteSlotAction iguais) ...
export async function createSlotAction(date: Date, hour: number, minute: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "Usuário não encontrado" };

  const startTime = new Date(date);
  startTime.setHours(hour, minute, 0, 0);
  const endTime = addMinutes(startTime, 30); 

  try {
    await prisma.agendaSlot.create({
      data: {
        userId: user.id,
        startTime,
        endTime,
        isBooked: false,
      },
    });
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    return { error: "Erro ao criar horário." };
  }
}

export async function deleteSlotAction(slotId: string) {
  try {
    await prisma.agendaSlot.delete({ where: { id: slotId } });
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    return { error: "Erro ao remover horário." };
  }
}