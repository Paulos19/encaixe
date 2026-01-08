import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/config/subscriptions";
import { sendSubscriptionSuccessEmail } from "@/lib/mail"; // Importe a função de email

// Helper para extrair data independente da config do SDK (camelCase vs snake_case)
function getSubscriptionEndDate(subscription: Stripe.Subscription): Date {
  // Tenta ler snake_case (padrão API) ou camelCase (padrão SDK typescript: true)
  const periodEndRaw = (subscription as any).current_period_end;
  const periodEndCamel = (subscription as any).currentPeriodEnd;

  let periodEnd: number | undefined;

  if (typeof periodEndRaw === 'number') {
    periodEnd = periodEndRaw;
  } else if (typeof periodEndCamel === 'number') {
    periodEnd = periodEndCamel;
  }
  
  if (periodEnd === undefined) {
    console.warn("⚠️ Data de expiração não encontrada na assinatura, usando data atual + 30 dias.");
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
  
  return new Date(periodEnd * 1000);
}

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

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    // ----------------------------------------------------------------------
    // CENÁRIO 1: Checkout Finalizado (Nova Assinatura)
    // ----------------------------------------------------------------------
    if (event.type === "checkout.session.completed") {
      if (!session.subscription) {
        return new Response(null, { status: 200 });
      }

      // Recupera a assinatura completa
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Validação Crítica: Verifica se temos o ID do usuário
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("❌ Metadata 'userId' ausente na sessão do Stripe.");
        return new Response("Metadata missing", { status: 400 });
      }

      // Identifica o plano
      const planKey = Object.keys(PLANS).find(
        (key) => PLANS[key as keyof typeof PLANS].stripePriceId === subscription.items.data[0].price.id
      );
      
      const planConfig = planKey ? PLANS[planKey as keyof typeof PLANS] : PLANS.ESSENTIAL;

      try {
        // Atualiza o banco
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: getSubscriptionEndDate(subscription),
            plan: planConfig.id,
            messageLimit: planConfig.quota,
            messagesSent: 0, // Reset no início da assinatura
          },
        });
        
        console.log(`✅ Assinatura criada para User: ${userId} | Plano: ${planConfig.name}`);

        // 🚀 DISPARO DE EMAIL DE SUCESSO
        try {
            await sendSubscriptionSuccessEmail(updatedUser.email, updatedUser.name || "Cliente", planConfig.name);
        } catch (emailError) {
            console.error("⚠️ Erro ao enviar email de assinatura:", emailError);
        }

      } catch (dbError) {
        console.error(`❌ Erro ao atualizar usuário ${userId}:`, dbError);
        return new Response("User update failed", { status: 200 }); 
      }
    }

    // ----------------------------------------------------------------------
    // CENÁRIO 2: Renovação Mensal (Pagamento da Fatura)
    // ----------------------------------------------------------------------
    if (event.type === "invoice.payment_succeeded") {
      const invoice: any = event.data.object as Stripe.Invoice;

      if ((invoice as any).subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        // Atualiza a renovação e reseta quota
        const result = await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: getSubscriptionEndDate(subscription),
            messagesSent: 0, // Reset mensal
          },
        });

        if (result.count > 0) {
          console.log(`🔄 Assinatura renovada: ${subscription.id}`);
        } else {
          console.warn(`⚠️ Assinatura renovada no Stripe mas usuário não encontrado: ${subscription.id}`);
        }
      }
    }

    // ----------------------------------------------------------------------
    // CENÁRIO 3 (OPCIONAL): Cancelamento ou Falha de Pagamento
    // ----------------------------------------------------------------------
    if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`⚠️ Assinatura cancelada ou falhou: ${subscription.id}`);
    }

  } catch (error: any) {
    console.error("❌ Erro fatal no processamento do Webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response(null, { status: 200 });
}