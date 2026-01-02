'use client';

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion"; // 1. Importe HTMLMotionProps

// 2. Mude a extensão da interface
interface PremiumCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  glow?: boolean;
}

export function PremiumCard({ 
  children, 
  className, 
  delay = 0, 
  glow = false, 
  ...props 
}: PremiumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      className={cn(
        "relative group rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900/80 via-zinc-900/50 to-zinc-950/80",
        "backdrop-blur-xl border border-white/5",
        className
      )}
      {...props} // Agora o spread funciona pois os tipos são compatíveis
    >
      {/* Efeito de Borda Brilhante no Hover */}
      <div className="absolute inset-0 p-[1px] rounded-3xl bg-gradient-to-br from-transparent via-white/10 to-transparent group-hover:via-amber-500/50 transition-all duration-700 opacity-0 group-hover:opacity-100" />
      
      {/* Background Glow Opcional */}
      {glow && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full group-hover:bg-amber-500/20 transition-all duration-700" />
      )}

      {/* Conteúdo Real */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
}