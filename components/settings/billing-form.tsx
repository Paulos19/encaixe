"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSession, createCustomerPortal } from "@/app/actions/stripe"; // Certifique-se que o caminho está correto
import { PLANS } from "@/config/subscriptions"; // Certifique-se que este arquivo existe conforme passo anterior
import { Plan } from "@prisma/client";

interface BillingFormProps {
  subscriptionPlan: Plan;
  isCanceled: boolean;
}

export function BillingForm({ subscriptionPlan, isCanceled }: BillingFormProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (planId: Plan) => {
    setIsLoading(planId);
    try {
      // Se o usuário clicar no plano que JÁ possui, ou se já tem assinatura paga e tenta mudar
      // A lógica simples é mandar pro Portal para evitar duplicidade ou confusão.
      // Se for FREE, manda pro Checkout.
      if (subscriptionPlan !== "FREE" && planId !== "FREE") {
         await createCustomerPortal();
      } else {
         await createCheckoutSession(planId);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
    } finally {
      // Não removemos o loading imediatamente pois haverá um redirect
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {Object.values(PLANS).map((plan) => {
        if (plan.id === "FREE") return null; // Opcional: Esconder o Free se quiser focar na venda

        const isCurrentPlan = subscriptionPlan === plan.id;
        
        return (
          <Card 
            key={plan.id} 
            className={cn(
              "flex flex-col relative overflow-hidden transition-all hover:shadow-lg",
              isCurrentPlan ? "border-primary shadow-md bg-primary/5" : "border-border"
            )}
          >
            {plan.id === "PRO" && (
              <div className="absolute top-0 right-0 p-2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-6">
              <div className="text-3xl font-bold">
                R$ {plan.price}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>
              
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Até <strong>{plan.quota}</strong> mensagens/mês
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Prioridade na Fila
                </li>
                {plan.id === "PLUS" && (
                  <li className="flex items-center gap-2">
                     <Check className="h-4 w-4 text-primary" />
                     Suporte Dedicado
                  </li>
                )}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrentPlan ? "outline" : "default"}
                disabled={isLoading !== null}
                onClick={() => handleAction(plan.id)}
              >
                {isLoading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCurrentPlan 
                  ? (isCanceled ? "Reativar Assinatura" : "Gerenciar Plano") 
                  : (subscriptionPlan !== "FREE" ? "Trocar no Portal" : "Assinar Agora")
                }
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}