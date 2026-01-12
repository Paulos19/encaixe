'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, MoreVertical, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { deleteWaitlist } from "@/app/actions/waitlist";
import { toast } from "sonner";

interface WaitlistGridProps {
  waitlists: any[];
}

// Componente isolado para o Menu de Ações (Evita re-renderizar todo o grid)
function WaitlistActions({ waitlistId, waitlistName }: { waitlistId: string, waitlistName: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Impede navegação do Link
    e.stopPropagation(); // Impede propagação

    // Confirmação simples (pode ser trocada por um Dialog se preferir)
    if (!confirm(`Tem certeza que deseja excluir a lista "${waitlistName}"? Todos os pacientes nela serão perdidos.`)) {
        return;
    }

    setLoading(true);
    const result = await deleteWaitlist(waitlistId);
    
    if (result.error) {
        toast.error(result.error);
        setLoading(false);
    } else {
        toast.success("Lista excluída com sucesso!");
        // Não precisa setar loading false pois o componente vai desmontar com o revalidatePath
    }
  };

  return (
    <div className="relative z-20"> {/* z-20 para ficar ACIMA do Link overlay */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white -mr-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    <span className="sr-only">Ações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer gap-2"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    <Trash2 className="h-4 w-4" />
                    Excluir Lista
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

export function WaitlistGrid({ waitlists }: WaitlistGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
            {/* AQUI ESTÁ O TRUQUE: 
               O Card é container relativo. 
               O Link é absoluto (overlay). 
               O Botão de Ações tem z-index maior.
            */}
            <Card className={cn(
              "h-full flex flex-col transition-all duration-300 border-zinc-200 dark:border-zinc-800 relative group overflow-hidden",
              "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm",
              "hover:border-amber-500/30 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] hover:-translate-y-1",
              !list.isActive && "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
            )}>
              {/* O Link cobre tudo (z-10), tornando o card clicável */}
              <Link 
                href={`/dashboard/waitlists/${list.id}`} 
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">Ver detalhes</span>
              </Link>

              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative">
                <div className="flex items-center gap-2 max-w-[85%]">
                    <CardTitle className="text-base font-semibold truncate text-zinc-900 dark:text-zinc-100">
                    {list.name}
                    </CardTitle>
                    {list.isActive ? (
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 shrink-0" />
                    )}
                </div>

                {/* Botão de Ações (z-20) */}
                <WaitlistActions waitlistId={list.id} waitlistName={list.name} />
              </CardHeader>

              <CardContent className="flex-1 flex flex-col relative pointer-events-none"> 
                {/* pointer-events-none no content para garantir que o clique passe pro Link, 
                    embora o z-index já resolva na maioria dos casos */}
                
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 h-8">
                  {list.description || "Sem descrição definida."}
                </p>
                
                <div className="flex items-end justify-between mt-auto">
                    <div>
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {list._count.entries}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold ml-1">
                            Na fila
                        </span>
                    </div>
                    
                    {/* Elemento visual do botão ir */}
                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
              </CardContent>
              
              {/* Barra de Progresso Decorativa */}
              <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 mt-auto relative">
                <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000" 
                    style={{ width: list._count.entries > 0 ? '100%' : '0%' }}
                />
              </div>
            </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}