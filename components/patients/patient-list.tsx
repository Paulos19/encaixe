'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MoreHorizontal, 
  Phone, 
  History, 
  User as UserIcon,
  Filter
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
import { PremiumCard } from '@/components/ui/premium-card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  _count: {
    waitlistEntries: number;
  };
}

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients: initialPatients }: PatientListProps) {
  const [search, setSearch] = useState('');
  
  // Filtragem local (Pode ser substituída por Server Search para grandes volumes)
  const filteredPatients = initialPatients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* --- BARRA DE FERRAMENTAS --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Bar Premium */}
        <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-600/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                <Input 
                    placeholder="Buscar por nome ou telefone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-zinc-900/50 border-white/10 text-zinc-200 focus:border-amber-500/30 focus:ring-amber-500/20 rounded-full h-11"
                />
            </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
                <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
                Exportar CSV
            </Button>
        </div>
      </div>

      {/* --- LISTA DE CARDS (Layout Grid para Mobile / Table para Desktop) --- */}
      <PremiumCard className="overflow-hidden p-0 min-h-[400px]">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/5 bg-zinc-900/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Contato</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Engajamento</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Cadastro</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredPatients.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-500">Nenhum paciente encontrado.</p>
                                </div>
                            </td>
                         </tr>
                    ) : (
                        filteredPatients.map((patient, index) => (
                        <motion.tr 
                            key={patient.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-white/[0.02] transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-zinc-800">
                                        <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-amber-500 font-bold text-xs">
                                            {patient.name.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                                            {patient.name}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                                    <Phone className="h-3 w-3 opacity-50" />
                                    {patient.phone}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 font-normal gap-1 hover:border-amber-500/30 hover:text-amber-500 transition-colors cursor-default">
                                    <History className="h-3 w-3" />
                                    {patient._count.waitlistEntries} Filas
                                </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                {formatDistanceToNow(new Date(patient.createdAt), { locale: ptBR, addSuffix: true })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                                        <DropdownMenuLabel>Opções</DropdownMenuLabel>
                                        <DropdownMenuItem className="cursor-pointer">Editar Dados</DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">Ver Histórico Completo</DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem className="text-red-400 hover:text-red-300 cursor-pointer">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </motion.tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </PremiumCard>
    </div>
  );
}