'use client';

import { motion } from "framer-motion";
import { Users, Calendar, CheckCircle2, TrendingUp, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

// Card Flutuante Genérico
const FloatingCard = ({ children, className, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8 }}
    className={className}
  >
    {children}
  </motion.div>
);

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-[600px] aspect-square mx-auto lg:mx-0 perspective-1000">
      
      {/* 1. Base do Dashboard (Efeito Glass + 3D Tilt) */}
      <motion.div
        initial={{ rotateX: 10, rotateY: -10, rotateZ: 2, scale: 0.9 }}
        animate={{ 
          rotateX: [10, 5, 10], 
          rotateY: [-10, -5, -10],
          y: [0, -10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 6, 
          ease: "easeInOut" 
        }}
        className="relative z-10 w-full h-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden"
      >
        {/* Fake Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
           <div className="flex gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500/50" />
             <div className="w-3 h-3 rounded-full bg-amber-500/50" />
             <div className="w-3 h-3 rounded-full bg-green-500/50" />
           </div>
           <div className="h-2 w-20 bg-zinc-800 rounded-full" />
        </div>

        {/* Fake Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <Users className="h-5 w-5 text-violet-400 mb-2" />
              <div className="h-2 w-12 bg-zinc-700 rounded mb-1" />
              <div className="h-4 w-8 bg-zinc-600 rounded" />
           </div>
           <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <TrendingUp className="h-5 w-5 text-emerald-400 mb-2" />
              <div className="h-2 w-12 bg-zinc-700 rounded mb-1" />
              <div className="h-4 w-8 bg-zinc-600 rounded" />
           </div>
        </div>

        {/* Fake Agenda List */}
        <div className="flex-1 bg-zinc-950/30 rounded-lg border border-zinc-800 p-3 space-y-3">
           {[1, 2, 3].map((i) => (
             <div key={i} className="flex items-center gap-3 p-2 rounded bg-zinc-800/40 border border-zinc-800/50">
                <div className="w-8 h-8 rounded-full bg-zinc-700" />
                <div className="space-y-1 flex-1">
                   <div className="h-2 w-24 bg-zinc-700 rounded" />
                   <div className="h-2 w-16 bg-zinc-800 rounded" />
                </div>
                <div className={`h-4 w-12 rounded ${i === 1 ? 'bg-amber-500/20' : 'bg-zinc-800'}`} />
             </div>
           ))}
        </div>
      </motion.div>

      {/* 2. Elementos Flutuantes (Parallax) */}
      
      {/* Notificação de Sucesso */}
      <FloatingCard 
        delay={0.5} 
        className="absolute -right-8 top-20 z-20"
      >
        <motion.div 
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl shadow-2xl shadow-emerald-900/20 flex items-center gap-3 w-64"
        >
          <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Status</p>
            <p className="text-sm font-bold text-white">Vaga Preenchida!</p>
          </div>
        </motion.div>
      </FloatingCard>

      {/* Card de Faturamento */}
      <FloatingCard 
        delay={0.8} 
        className="absolute -left-8 bottom-32 z-20"
      >
        <motion.div 
          animate={{ y: [5, -5, 5] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="bg-zinc-900 border border-amber-500/30 p-4 rounded-xl shadow-2xl shadow-amber-900/20 w-56"
        >
          <div className="flex justify-between items-start mb-2">
             <div className="bg-amber-500/20 p-1.5 rounded-lg text-amber-500">
                <TrendingUp className="h-4 w-4" />
             </div>
             <span className="text-xs font-mono text-emerald-400">+12%</span>
          </div>
          <p className="text-xs text-zinc-400">Receita Recuperada</p>
          <p className="text-lg font-bold text-white">R$ 4.250,00</p>
        </motion.div>
      </FloatingCard>

      {/* Notificação WhatsApp */}
      <FloatingCard 
        delay={1.1} 
        className="absolute right-0 -bottom-6 z-30"
      >
        <motion.div 
           animate={{ scale: [1, 1.02, 1] }}
           transition={{ repeat: Infinity, duration: 3 }}
           className="bg-[#25D366] text-zinc-900 p-3 rounded-lg shadow-xl flex items-center gap-3 max-w-xs"
        >
           <Bell className="h-4 w-4 fill-current" />
           <p className="text-xs font-bold">"Olá, confirmo meu encaixe para as 14h!"</p>
        </motion.div>
      </FloatingCard>

      {/* Glow de fundo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-violet-500/10 to-transparent blur-3xl -z-10 rounded-full" />
    </div>
  );
}