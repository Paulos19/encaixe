import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingForm } from "@/components/settings/billing-form";
import { PlanUsageCard } from "@/components/settings/plan-usage-card"; // Importe o componente novo
import { Separator } from "@/components/ui/separator";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Busca otimizada
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      plan: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      messageLimit: true,
      messagesSent: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Preparar os dados de forma segura para o componente Client
  // Convertendo data para string ou passando Date puro (Server Component -> Client Component aceita Date se configurado, mas idealmente passamos props serializáveis ou o componente lida bem)
  // No código do card eu usei Date | null, então está ok.

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      {/* Header da Página */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Assinatura e Limites
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerencie seu plano, faturas e acompanhe o consumo de mensagens do mês.
        </p>
      </div>

      <Separator className="my-6" />

      {/* 1. Componente de Status Visual (Novo) */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Status da Conta
        </h2>
        <PlanUsageCard user={user} />
      </section>

      {/* 2. Formulário de Billing (Planos e Stripe) */}
      <section className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Planos Disponíveis
        </h2>
        
        {/* Aqui injetamos o componente que você já tinha ou vai criar para listar os preços */}
        <BillingForm 
          subscriptionPlan={user.plan} 
          isCanceled={false} // Se tiver lógica de cancelamento no futuro, injete aqui
        />
      </section>
    </div>
  );
}