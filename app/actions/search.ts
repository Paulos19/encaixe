'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function globalSearch(query: string) {
  const session = await auth();
  if (!session?.user?.email) return { patients: [], waitlists: [] };

  if (!query || query.length < 2) {
    return { patients: [], waitlists: [] };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { patients: [], waitlists: [] };

    // Busca Paralela: Pacientes e Listas
    const [patients, waitlists] = await Promise.all([
      // 1. Buscar Pacientes (Nome ou Telefone)
      prisma.patient.findMany({
        where: {
          managerId: user.id,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true }
      }),
      // 2. Buscar Listas de Espera (Nome)
      prisma.waitlist.findMany({
        where: {
          ownerId: user.id,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, name: true }
      })
    ]);

    return { patients, waitlists };

  } catch (error) {
    console.error("Erro na busca:", error);
    return { patients: [], waitlists: [] };
  }
}