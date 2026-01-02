'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateWaitlistSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
  description: z.string().optional(),
});

export async function createWaitlist(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "Não autorizado" };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = CreateWaitlistSchema.safeParse(data);

  if (!validated.success) {
    return { error: "Dados inválidos" };
  }

  try {
    // Buscamos o ID do usuário baseado no email da sessão
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return { error: "Usuário não encontrado" };

    await prisma.waitlist.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        ownerId: user.id,
      },
    });

    revalidatePath('/dashboard/waitlists');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar lista" };
  }
}