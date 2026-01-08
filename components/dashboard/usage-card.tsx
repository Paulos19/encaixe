"use client";

import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UsageCardProps {
  usageData: {
    plan: "FREE" | "ESSENTIAL" | "PRO" | "PLUS";
    used: number;
    limit: number;
  };
}

export function UsageCard({ usageData }: UsageCardProps) {
  const percentage = Math.min((usageData.used / usageData.limit) * 100, 100);
  
  // Cores mais sofisticadas (Gradients no progress bar)
  const progressGradient = percentage > 90 
    ? "bg-gradient-to-r from-red-500 to-red-600" 
    : percentage > 75 
      ? "bg-gradient-to-r from-amber-400 to-amber-500" 
      : "bg-gradient-to-r from-emerald-400 to-emerald-500";

  return (
    <div className="px-2 pb-2">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="group relative overflow-hidden rounded-xl bg-zinc-900 p-4 shadow-xl ring-1 ring-white/10"
      >
         {/* Background Decorativo Sutil */}
         <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-black/80" />
         <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
         
         <div className="relative z-10 flex flex-col gap-3">
            
            {/* Cabeçalho Compacto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 shadow-inner ring-1 ring-white/10">
                    <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Plano Atual</p>
                    <p className="text-sm font-bold text-white leading-none">{usageData.plan}</p>
                 </div>
              </div>
              {/* Badge de Porcentagem */}
              <div className={cn(
                "flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
                percentage > 90 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              )}>
                {Math.round(percentage)}% uso
              </div>
            </div>

            {/* Barra de Progresso + Texto */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950 ring-1 ring-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${percentage}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", progressGradient)}
                 />
              </div>
              <p className="text-[10px] text-right text-zinc-500 font-medium">
                 <span className="text-zinc-300">{usageData.used}</span> <span className="text-zinc-600">/</span> {usageData.limit} envios
              </p>
            </div>

            {/* Botão "Invisible" (Área clicável inteira ou link discreto) */}
            <Link 
              href="/dashboard/settings/billing" 
              className="flex items-center justify-center gap-1 rounded-lg bg-white/5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white border border-white/5"
            >
              Gerenciar Assinatura
              <ChevronRight className="h-3 w-3 opacity-50" />
            </Link>
         </div>
      </motion.div>
    </div>
  );
}