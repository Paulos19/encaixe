'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PLANS } from '@/config/subscriptions';
import { addDays } from 'date-fns';

const GrantTrialSchema = z.object({
  userId: z.string().cuid(),
  plan: z.enum(["ESSENTIAL", "PRO", "PLUS"]),
  days: z.coerce.number().min(1).max(365),
});

export async function grantTrialAction(formData: FormData) {
  // 1. Verificação de Segurança (RBAC)
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    return { error: "Acesso negado. Apenas administradores." };
  }

  // 2. Validação
  const data = Object.fromEntries(formData.entries());
  const validated = GrantTrialSchema.safeParse(data);

  if (!validated.success) {
    return { error: "Dados inválidos." };
  }

  const { userId, plan, days } = validated.data;
  const planConfig = PLANS[plan];

  try {
    // 3. Aplicação do Trial
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        isTrial: true,
        // Define a expiração para o futuro
        stripeCurrentPeriodEnd: addDays(new Date(), days),
        // Atualiza os limites conforme o plano escolhido
        messageLimit: planConfig.quota,
        // Importante: Não mexemos no stripeSubscriptionId para não conflitar com o Stripe real.
        // Se ele tinha uma assinatura antiga cancelada, ela continua lá como referência.
      },
    });

    revalidatePath('/admin/tenants');
    return { success: true, message: `Trial do plano ${plan} concedido por ${days} dias!` };

  } catch (error) {
    console.error("Erro ao conceder trial:", error);
    return { error: "Erro interno ao atualizar usuário." };
  }
}