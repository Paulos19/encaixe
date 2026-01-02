'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Zap, ArrowRight } from 'lucide-react';
import { CreateWaitlistDialog } from '@/components/waitlist/create-waitlist-dialog'; 
// Nota: Ajuste os imports dos Dialogs conforme sua estrutura, ou use botões simples por enquanto.

interface GreetingCardProps {
  userName: string;
  waitingCount: number;
}

export function GreetingCard({ userName, waitingCount }: GreetingCardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 text-white shadow-2xl border border-white/10 group"
    >
      {/* Background Effects */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl group-hover:bg-amber-500/30 transition-all duration-1000" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur-md border border-white/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Sistema Operacional
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">{userName}</span>
          </h1>
          
          <p className="text-zinc-400 max-w-lg text-lg">
            Você tem <span className="text-amber-400 font-bold">{waitingCount} pacientes</span> aguardando encaixe hoje. 
            O movimento está ótimo!
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
            {/* Atalhos Rápidos */}
            <Button className="bg-white text-black hover:bg-zinc-200 border-0 font-semibold shadow-lg shadow-white/10">
                <Plus className="mr-2 h-4 w-4" /> Nova Lista
            </Button>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-amber-400 transition-colors backdrop-blur-sm">
                Ver Relatórios <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </div>
    </motion.div>
  );
}