"use client";

import { motion } from "framer-motion";
import { Zap, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS } from "@/config/subscriptions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanUsageCardProps {
  user: {
    plan: "FREE" | "ESSENTIAL" | "PRO" | "PLUS";
    messagesSent: number;
    messageLimit: number;
    stripeCurrentPeriodEnd: Date | null;
  };
}

export function PlanUsageCard({ user }: PlanUsageCardProps) {
  // Cálculos
  const percentage = Math.min((user.messagesSent / user.messageLimit) * 100, 100);
  const isPro = user.plan !== "FREE";
  const daysLeft = user.stripeCurrentPeriodEnd 
    ? Math.ceil((new Date(user.stripeCurrentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Definição de Cores Dinâmicas
  const statusColor = percentage > 90 
    ? "text-red-500" 
    : percentage > 75 
      ? "text-amber-500" 
      : "text-emerald-500";
  
  const progressClass = percentage > 90 
    ? "bg-red-500" 
    : percentage > 75 
      ? "bg-amber-500" 
      : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm"
    >
      {/* Background Decorativo para Planos PRO */}
      {isPro && (
        <>
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative z-10 grid gap-8 md:grid-cols-2">
        {/* Lado Esquerdo: Informações do Plano */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800", isPro ? "text-amber-500" : "text-zinc-500")}>
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
              <h3 className="text-2xl font-bold tracking-tight">{PLANS[user.plan].name}</h3>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                {isPro ? "Renovação Automática" : "Plano Gratuito Vitalício"}
              </span>
            </div>
            {isPro && user.stripeCurrentPeriodEnd && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>
                  Renova em <span className="text-foreground font-medium">{format(user.stripeCurrentPeriodEnd, "dd 'de' MMMM", { locale: ptBR })}</span> ({daysLeft} dias)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Métricas de Uso */}
        <div className="flex flex-col justify-center space-y-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-5 border border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consumo do Ciclo</span>
            <span className={cn("text-sm font-bold", statusColor)}>
              {percentage.toFixed(0)}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
               <motion.div 
                 className={cn("h-full rounded-full transition-all", progressClass)}
                 initial={{ width: 0 }}
                 animate={{ width: `${percentage}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
               />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{user.messagesSent} enviadas</span>
              <span>Limite: {user.messageLimit}</span>
            </div>
          </div>

          {/* Alerta de Limite */}
          {percentage >= 100 ? (
             <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Limite atingido. O robô está pausado.</span>
             </div>
          ) : percentage >= 80 ? (
             <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Atenção: Você está perto do limite.</span>
             </div>
          ) : (
            <div className="p-2"></div> // Spacer
          )}
        </div>
      </div>
    </motion.div>
  );
}