"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  // Cálculo de Força
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return 0;
    
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Especial

    return score;
  }, [password]);

  // Labels e Cores
  const getStrengthData = () => {
    switch (strength) {
      case 0: return { label: "Digite sua senha", color: "bg-zinc-200 dark:bg-zinc-800" };
      case 1: return { label: "Fraca", color: "bg-red-500" };
      case 2: return { label: "Média", color: "bg-amber-500" };
      case 3: return { label: "Boa", color: "bg-blue-500" };
      case 4: return { label: "Forte", color: "bg-emerald-500" };
      default: return { label: "", color: "bg-zinc-200" };
    }
  };

  const { label, color } = getStrengthData();

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-1.5 w-full">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-full flex-1 rounded-full transition-all duration-300",
              strength >= level ? color : "bg-zinc-100 dark:bg-zinc-800"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Força da senha:</p>
        <motion.p 
          key={label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("text-xs font-medium", strength === 4 ? "text-emerald-600" : "text-zinc-500")}
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}