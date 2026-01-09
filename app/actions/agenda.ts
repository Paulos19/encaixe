'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMinutes, startOfDay, endOfDay, addDays } from 'date-fns';
import { getClinicAvailableSlots, getClinicBookings } from '@/lib/clinic';

export interface UnifiedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  source: 'LOCAL' | 'CLINIC';
  details?: string;
}

export async function getWeekSlots(startDate: Date): Promise<UnifiedSlot[]> {
  const session = await auth();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];

  const start = startOfDay(startDate);
  const endOfWeek = endOfDay(addDays(start, 6));

  // 1. Busca Local (Prisma)
  const localSlotsPromise = prisma.agendaSlot.findMany({
    where: {
      userId: user.id,
      startTime: { gte: start, lte: endOfWeek },
    },
    orderBy: { startTime: 'asc' },
  });

  // 2. Busca Clinic (API) em Paralelo
  const clinicDataPromise = (async () => {
    try {
      const [available, bookings] = await Promise.all([
        getClinicAvailableSlots(start, 7),
        getClinicBookings(start, 7)
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

// --- ACTIONS DE MUTAÇÃO (Mantidas iguais, mas reforçando) ---

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