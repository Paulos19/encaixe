'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Clock, MoreVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WaitlistGridProps {
  waitlists: any[];
}

export function WaitlistGrid({ waitlists }: WaitlistGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (waitlists.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-zinc-50/50 dark:bg-zinc-900/20"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mb-4">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Nenhuma lista ativa</h3>
        <p className="mb-6 mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
          Comece criando sua primeira lista de espera para organizar seus pacientes e automatizar os encaixes.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {waitlists.map((list) => (
        <motion.div key={list.id} variants={item}>
          <Link href={`/dashboard/waitlists/${list.id}`} className="block h-full group outline-none">
            <Card className={cn(
              "h-full flex flex-col transition-all duration-300 border-zinc-200 dark:border-zinc-800",
              "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm",
              "hover:border-amber-500/30 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] hover:-translate-y-1",
              !list.isActive && "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
            )}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold truncate pr-2 text-zinc-900 dark:text-zinc-100">
                  {list.name}
                </CardTitle>
                {list.isActive ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 h-8">
                  {list.description || "Sem descrição definida."}
                </p>
                
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {list._count.entries}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold ml-1">
                            Na fila
                        </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
              </CardContent>
              {/* Barra de Progresso Decorativa */}
              <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 mt-auto">
                <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000" 
                    style={{ width: list._count.entries > 0 ? '100%' : '0%' }}
                />
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}