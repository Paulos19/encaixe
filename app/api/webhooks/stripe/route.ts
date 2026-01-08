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
  } catch (error: any) {
    console.error(`❌ Erro de Assinatura Webhook: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    // ----------------------------------------------------------------------
    // CENÁRIO 1: Checkout Finalizado (Compra Inicial)
    // ----------------------------------------------------------------------
    if (event.type === "checkout.session.completed") {
      // Verifica se houve assinatura criada
      if (!session.subscription) {
        // Se for pagamento único (não implementado aqui), apenas retornamos 200
        return new Response(null, { status: 200 });
      }

      // Recupera a assinatura completa para ter acesso seguro às datas
      const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Identifica o plano (Logica de Fallback segura)
      const planKey = Object.keys(PLANS).find(
        (key) => PLANS[key as keyof typeof PLANS].stripePriceId === subscription.items.data[0].price.id
      );
      const planConfig = PLANS[planKey as keyof typeof PLANS] || PLANS.FREE;

      // Atualiza o usuário
      await prisma.user.update({
        where: { id: session.metadata?.userId },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          // Garante conversão segura de data
          stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          plan: planConfig.id,
          messageLimit: planConfig.quota,
          messagesSent: 0,
        },
      });
      
      console.log(`✅ Plano ${planConfig.name} ativado para usuário ${session.metadata?.userId}`);
    }

    // ----------------------------------------------------------------------
    // CENÁRIO 2: Renovação Mensal com Sucesso
    // ----------------------------------------------------------------------
    if (event.type === "invoice.payment_succeeded") {
      const invoice: any = event.data.object as Stripe.Invoice;

      // Verifica se o invoice pertence a uma assinatura (pode ser invoice de one-off)
      if ((invoice as any).subscription) {
        const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        // Atualiza a data de expiração e RESETA o contador de mensagens
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            messagesSent: 0, // Reset mensal crítico
          },
        });
        
        console.log(`🔄 Assinatura renovada para ${subscription.id}`);
      }
    }

  } catch (error: any) {
    // Loga o erro mas retorna 200 ou 500 dependendo da estratégia. 
    // Retornar 500 faz o Stripe tentar de novo (bom para falhas de rede, ruim para bugs de código).
    console.error("❌ Erro ao processar evento do Stripe:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}