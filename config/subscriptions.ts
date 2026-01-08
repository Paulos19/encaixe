import { Plan } from "@prisma/client";

export interface SubscriptionPlan {
  id: Plan;
  name: string;
  description: string;
  stripePriceId: string; // Você pegará isso no Dashboard do Stripe
  quota: number;         // Limite de mensagens
  price: number;
}

export const PLANS: Record<Plan, SubscriptionPlan> = {
  FREE: {
    id: "FREE",
    name: "Grátis",
    description: "Para testar a plataforma",
    stripePriceId: "", 
    quota: 10,
    price: 0,
  },
  ESSENTIAL: {
    id: "ESSENTIAL",
    name: "Encaixe Essencial",
    description: "Para clínicas pequenas",
    stripePriceId: process.env.STRIPE_PRICE_ID_ESSENTIAL!,
    quota: 100,
    price: 197,
  },
  PRO: {
    id: "PRO",
    name: "Encaixe Pro",
    description: "Recomendado para clínicas ativas",
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO!,
    quota: 300,
    price: 297,
  },
  PLUS: {
    id: "PLUS",
    name: "Encaixe Plus",
    description: "Alta performance",
    stripePriceId: process.env.STRIPE_PRICE_ID_PLUS!,
    quota: 800,
    price: 497,
  },
};