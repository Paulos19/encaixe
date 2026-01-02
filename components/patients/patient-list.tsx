'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MoreHorizontal, 
  Phone, 
  History, 
  User as UserIcon,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  _count: {
    entries: number;
  };
}

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients: initialPatients }: PatientListProps) {
  const [search, setSearch] = useState('');
  
  const filteredPatients = initialPatients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const getAvatarColor = (name: string) => {
    const colors = [
        "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
        "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
        "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
        "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    ];
    return colors[name.length % colors.length];
  };

  return (
    <div className="space-y-4">
      
      {/* --- BARRA DE FERRAMENTAS RESPONSIVA --- */}
      {/* Flex-col no mobile para empilhar busca e botões */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center bg-white dark:bg-zinc-900/50 p-3 md:p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
        
        {/* Busca Full Width no Mobile */}
        <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
            <Input 
                placeholder="Buscar por nome ou telefone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border-transparent bg-zinc-100/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-950 focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10 rounded-xl h-10"
            />
        </div>

        {/* Botões lado a lado no Mobile (flex-row com w-full) */}
        <div className="flex gap-2 w-full md:w-auto px-0 md:px-2">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none h-9 rounded-lg border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Filter className="mr-2 h-3.5 w-3.5" /> 
                Filtros
            </Button>
            <Button variant="outline" size="sm" className="flex-1 md:flex-none h-9 rounded-lg border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Download className="mr-2 h-3.5 w-3.5" /> 
                Exportar
            </Button>
        </div>
      </div>

      {/* --- TABELA COM SCROLL HORIZONTAL --- */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full"> {/* <-- CRÍTICO: Permite scroll horizontal */}
            <table className="w-full min-w-[700px]"> {/* <-- CRÍTICO: Garante largura mínima para não espremer colunas */}
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80">
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Paciente</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Contato</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Histórico</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Cadastro</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    <AnimatePresence>
                    {filteredPatients.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-16 text-center">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-zinc-400" />
                                    </div>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-200">Nenhum paciente encontrado</p>
                                </motion.div>
                            </td>
                         </tr>
                    ) : (
                        filteredPatients.map((patient, index) => (
                        <motion.tr 
                            key={patient.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-700/50">
                                        <AvatarFallback className={cn("font-bold text-xs", getAvatarColor(patient.name))}>
                                            {patient.name.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                            {patient.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider hidden sm:block">
                                            #{patient.id.slice(-4)}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-900/50 w-fit px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                                    <Phone className="h-3 w-3 text-zinc-400" />
                                    {patient.phone}
                                </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="secondary" className={cn(
                                    "font-medium border gap-1.5",
                                    patient._count.entries > 0 
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400" 
                                        : "bg-zinc-100 text-zinc-500"
                                )}>
                                    <History className="h-3 w-3" />
                                    {patient._count.entries} {patient._count.entries === 1 ? "Fila" : "Filas"}
                                </Badge>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                    {formatDistanceToNow(new Date(patient.createdAt), { locale: ptBR, addSuffix: true })}
                                </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                                        <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-pointer">
                                            <UserIcon className="mr-2 h-4 w-4" /> Editar Dados
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <History className="mr-2 h-4 w-4" /> Ver Histórico
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-500 cursor-pointer">
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </motion.tr>
                        ))
                    )}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}