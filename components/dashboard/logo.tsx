"use client";

import { Box, Layers } from "lucide-react"; // Ícones que remetem a encaixe/camadas
import { motion, AnimatePresence } from "framer-motion";

interface LogoProps {
  isCollapsed: boolean;
}

export function Logo({ isCollapsed }: LogoProps) {
  return (
    <div className="flex items-center gap-3 overflow-hidden py-2">
      {/* Ícone da Marca (Gradiente Dourado) */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40">
        <Layers className="h-6 w-6 text-white" />
        
        {/* Brilho extra (Overlay) */}
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
      </div>

      {/* Texto da Marca */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col justify-center"
          >
            <h1 className="text-xl font-bold leading-none tracking-tight text-zinc-900 dark:text-white">
              Encaixe
              {/* Texto com Gradiente (Dourado Textual) */}
              <span className="ml-1 bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                Já
              </span>
            </h1>
            <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Lista de Espera Inteligente
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}