'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      price: isAnnual ? "R$ 197" : "R$ 247",
      description: "Para consultórios individuais começando a automatizar.",
      features: [
        "1 Médico/Agenda",
        "Até 200 disparos/mês",
        "Lista de Espera Básica",
        "Integração ClinicWeb/Feegow",
        "Suporte por Email"
      ],
      notIncluded: ["Múltiplos usuários", "Dashboard Avançado", "API"],
      highlight: false
    },
    {
      name: "Pro",
      price: isAnnual ? "R$ 397" : "R$ 497",
      description: "O favorito de clínicas em crescimento.",
      features: [
        "Até 5 Médicos/Agendas",
        "Disparos Ilimitados",
        "Lista de Espera Inteligente (Prioridade)",
        "Confirmação Automática no ERP",
        "Dashboard de Receita Recuperada",
        "Suporte Prioritário WhatsApp"
      ],
      notIncluded: ["API Dedicada"],
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Sob Consulta",
      description: "Para redes de clínicas e hospitais.",
      features: [
        "Agendas Ilimitadas",
        "Múltiplas Unidades",
        "API Dedicada",
        "Gerente de Conta Exclusivo",
        "Customização White-label",
        "SLA de 99.9%"
      ],
      notIncluded: [],
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Simples e Transparente.
          </h2>
          <p className="text-zinc-400 text-lg">
            Escolha o plano que se adapta ao tamanho da sua clínica.
            <br className="hidden md:block" /> Sem taxas escondidas de implementação.
          </p>

          {/* Toggle Anual/Mensal */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <span className={cn("text-sm font-medium", !isAnnual ? "text-white" : "text-zinc-500")}>Mensal</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-zinc-800 border border-zinc-700 transition-colors hover:border-zinc-600 focus:outline-none"
            >
              <motion.div
                animate={{ x: isAnnual ? 28 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-0 w-5 h-5 rounded-full bg-amber-500 shadow-lg"
              />
            </button>
            <span className={cn("text-sm font-medium", isAnnual ? "text-white" : "text-zinc-500")}>
              Anual <span className="text-amber-500 text-xs ml-1 font-bold">(-20%)</span>
            </span>
          </div>
        </div>

        {/* Grid de Planos */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300",
                plan.highlight 
                  ? "bg-zinc-900/80 border-amber-500/50 shadow-2xl shadow-amber-900/20 md:-mt-8 md:mb-8 z-10" 
                  : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none px-4 py-1 text-xs font-bold uppercase tracking-wider shadow-lg">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-medium text-zinc-300">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.price !== "Sob Consulta" && <span className="text-zinc-500">/mês</span>}
                </div>
                <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                    <X className="h-5 w-5 text-zinc-700 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.highlight ? "default" : "outline"}
                className={cn(
                  "w-full h-12 rounded-full font-bold transition-all",
                  plan.highlight 
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-amber-900/40 hover:scale-105" 
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}
              >
                {plan.name === "Enterprise" ? "Falar com Consultor" : "Começar Agora"}
              </Button>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}