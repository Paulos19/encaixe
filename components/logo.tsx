'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-start")}>
      {/* Container da Joia (Ícone) */}
      <div className="relative group">
        {/* Glow Dourado de Fundo (Blur) - Cria o destaque "camuflagem zero" */}
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-400 opacity-25 group-hover:opacity-50 blur-md transition duration-500" />
        
        {/* O Ícone Físico */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-amber-500/30 shadow-inner shadow-white/5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Definição do Gradiente Metálico */}
            <defs>
              <linearGradient id="gold-metal" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FCD34D" />   {/* Ouro Claro */}
                <stop offset="50%" stopColor="#F59E0B" />  {/* Ouro Médio */}
                <stop offset="100%" stopColor="#B45309" /> {/* Bronze/Ouro Escuro */}
              </linearGradient>
            </defs>

            {/* Parte 1 do Encaixe (Superior Esquerda) */}
            <motion.path
              d="M14 7H8C5.79086 7 4 8.79086 4 11V11C4 13.2091 5.79086 15 8 15H10"
              stroke="url(#gold-metal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            />
            
            {/* Parte 2 do Encaixe (Inferior Direita) */}
            <motion.path
              d="M10 17H16C18.2091 17 20 15.2091 20 13V13C20 10.7909 18.2091 9 16 9H14"
              stroke="url(#gold-metal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* O "Click" do meio (A conexão) */}
            <motion.line
              x1="9" y1="13" x2="15" y2="11"
              stroke="url(#gold-metal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5, type: "spring" }}
            />
          </svg>
        </div>
      </div>

      {/* Texto */}
      <motion.div
        animate={{ 
            opacity: collapsed ? 0 : 1, 
            width: collapsed ? 0 : "auto",
            x: collapsed ? -20 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col overflow-hidden whitespace-nowrap"
      >
        <span className="text-lg font-bold tracking-tight text-white drop-shadow-sm">
          Encaixe Já
        </span>
        <div className="flex items-center gap-1.5">
            <span className="h-[1px] w-4 bg-gradient-to-r from-amber-500 to-transparent"></span>
            <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">
            Premium
            </span>
        </div>
      </motion.div>
    </div>
  );
}