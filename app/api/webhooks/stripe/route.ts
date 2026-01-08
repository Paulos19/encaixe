import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/config/subscriptions";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 1. Assinatura Criada (Checkout completado)
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Identificar qual plano é baseando-se no ID do preço
    const planKey = Object.keys(PLANS).find(
      (key) => PLANS[key as keyof typeof PLANS].stripePriceId === subscription.items.data[0].price.id
    );
    const planConfig = PLANS[planKey as keyof typeof PLANS] || PLANS.FREE;

    await prisma.user.update({
      where: { id: session.metadata?.userId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan: planConfig.id,
        messageLimit: planConfig.quota,
        messagesSent: 0, // Reseta contador na assinatura
      },
    });
  }

  // 2. Assinatura Renovada (Pagamento mensal bem sucedido)
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        messagesSent: 0, // <--- AQUI ESTÁ A MÁGICA: Reset mensal automático
      },
    });
  }

  return new Response(null, { status: 200 });
}