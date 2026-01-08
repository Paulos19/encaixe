import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingForm } from "@/components/settings/billing-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Se não tiver, instale ou use div simples
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from "lucide-react";
import { PLANS } from "@/config/subscriptions";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

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

  // Lógica simples para verificar se está cancelado (se tivermos a data no passado ou campo específico)
  // Como não adicionamos campo "status" no prisma, vamos assumir ativo se tiver subscriptionId
  // Para robustez total, adicionaríamos `stripeSubscriptionStatus` no schema.
  const isPro = user.plan !== "FREE";
  const usagePercent = Math.min((user.messagesSent / user.messageLimit) * 100, 100);

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinatura e Planos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu plano e acompanhe o uso de mensagens.
        </p>
      </div>

      <Separator />

      {/* Seção de Uso Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Seu Plano Atual: <span className="text-primary">{PLANS[user.plan].name}</span>
          </CardTitle>
          <CardDescription>
            {isPro 
              ? `Renova em ${user.stripeCurrentPeriodEnd?.toLocaleDateString('pt-BR')}`
              : "Você está no plano gratuito."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Consumo mensal</span>
              <span className="font-medium text-muted-foreground">
                {user.messagesSent} / {user.messageLimit} mensagens
              </span>
            </div>
            {/* Componente Progress do ShadcnUI */}
            <Progress value={usagePercent} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">
              {100 - usagePercent < 10 && "Atenção: Você está quase atingindo o limite!"}
            </p>
          </div>
          
          {user.messagesSent >= user.messageLimit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Limite Atingido</AlertTitle>
              <AlertDescription>
                Seus disparos estão pausados. Faça um upgrade para continuar enviando.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Grid de Planos */}
      <BillingForm 
        subscriptionPlan={user.plan} 
        isCanceled={false} // Placeholder enquanto não temos o status exato
      />
    </div>
  );
}