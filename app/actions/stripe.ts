"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/config/subscriptions";
import { redirect } from "next/navigation";
import { Plan } from "@prisma/client";

const absoluteUrl = (path: string) => 
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;

export async function createCheckoutSession(planId: Plan) {
  const session = await auth();
  
  if (!session?.user || !session.user.email) {
    return { error: "Você precisa estar logado para assinar." };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const planConfig = PLANS[planId];
  if (!planConfig || !planConfig.stripePriceId) {
    return { error: "Plano inválido ou não configurado." };
  }

  // Se o usuário já tem um Customer ID no Stripe, reutilizamos.
  let customerId = user.stripeCustomerId;

  // Se já tem assinatura ativa, redireciona para o Portal de Gerenciamento
  if (user.stripeSubscriptionId && user.plan === planId) {
     return await createCustomerPortal();
  }

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: absoluteUrl("/dashboard/settings/billing?success=true"),
      cancel_url: absoluteUrl("/dashboard/settings/billing?canceled=true"),
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: customerId ? undefined : user.email, // Se já tem ID, não manda email
      customer: customerId || undefined,
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id, // <--- CRUCIAL: O Webhook precisa disso
      },
    });

    if (!stripeSession.url) {
      throw new Error("Erro ao gerar URL do Stripe.");
    }

    redirect(stripeSession.url);
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    // Como é uma Server Action chamada de um Client Component, 
    // se usarmos redirect() fora do try/catch funciona, mas erros precisam ser retornados.
    // O redirect lança um erro NEXT_REDIRECT internamente, então precisamos relançar se for isso.
    if ((error as any).message === "NEXT_REDIRECT") throw error;
    
    return { error: "Erro ao conectar com o provedor de pagamento." };
  }
}

export async function createCustomerPortal() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
  });

  if (!user?.stripeCustomerId) {
    return { error: "Você não possui uma assinatura ativa para gerenciar." };
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: absoluteUrl("/dashboard/settings/billing"),
    });

    redirect(portalSession.url);
  } catch (error) {
    if ((error as any).message === "NEXT_REDIRECT") throw error;
    return { error: "Erro ao abrir portal de faturamento." };
  }
}