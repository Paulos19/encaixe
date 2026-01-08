"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/config/subscriptions";
import { redirect } from "next/navigation";
import { Plan } from "@prisma/client";

// URL absoluta para redirecionamento
const absoluteUrl = (path: string) => `${process.env.NEXT_PUBLIC_APP_URL}${path}`;

export async function createCheckoutSession(planId: Plan) {
  const session = await auth();
  if (!session?.user || !session.user.email) return { error: "Não autorizado" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return { error: "Usuário não encontrado" };

  const planConfig = PLANS[planId];

  // Se o usuário já tem um Customer ID no Stripe, usamos ele. Senão, o Stripe cria no checkout.
  // Nota: Para sistemas em prod, é melhor criar o Customer antes, mas simplificaremos.
  
  // Se o usuário JÁ ASSINA e quer gerenciar, mandamos pro Portal
  if (user.stripeSubscriptionId && user.plan === planId) {
     return await createCustomerPortal();
  }

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: absoluteUrl("/dashboard/settings/billing?success=true"),
    cancel_url: absoluteUrl("/dashboard/settings/billing?canceled=true"),
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    customer_email: user.email,
    line_items: [
      {
        price: planConfig.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id, // Importante para o Webhook saber quem é
    },
  });

  redirect(stripeSession.url!);
}

export async function createCustomerPortal() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
  });

  if (!user?.stripeCustomerId) return { error: "Sem assinatura ativa" };

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: absoluteUrl("/dashboard/settings/billing"),
  });

  redirect(portalSession.url);
}