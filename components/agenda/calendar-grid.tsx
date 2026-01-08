"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Link2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSlotAction, deleteSlotAction, UnifiedSlot } from "@/app/actions/agenda";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarGridProps {
  initialSlots: UnifiedSlot[];
}

export function CalendarGrid({ initialSlots }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Inicia a semana no Domingo (0) ou Segunda (1) - Ajuste conforme preferência
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  
  // Gera os 7 dias da semana atual
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Gera as horas do dia (07:00 até 19:00)
  // Ajuste o range se sua clínica funciona em horários diferentes
  const startHour = 7;
  const endHour = 19;
  const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => i + startHour);

  const handleCreateSlot = async (day: Date, hour: number) => {
    // Chama a server action para criar um slot manual (LOCAL)
    const result = await createSlotAction(day, hour, 0); // 0 minutos (início da hora)
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Horário disponibilizado para encaixe!");
    }
  };

  const handleDeleteSlot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteSlotAction(id);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Horário removido.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      
      {/* --- HEADER DA AGENDA --- */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold capitalize text-zinc-800 dark:text-zinc-100 w-48">
            {format(startDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* LEGENDA DE CORES */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5" title="Criado por você, pronto para encaixe">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> 
                <span className="font-medium">Manual (Livre)</span>
            </div>
            <div className="flex items-center gap-1.5" title="Vindo do ERP Clinic, vago">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> 
                <span className="font-medium">Clinic (Livre)</span>
            </div>
            <div className="flex items-center gap-1.5" title="Ocupado por paciente">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-400"></div> 
                <span>Ocupado</span>
            </div>
        </div>
      </div>

      {/* --- GRID SEMANAL --- */}
      <div className="flex flex-1 overflow-auto relative">
        {/* Coluna de Horas (Eixo Y) */}
        <div className="w-14 md:w-16 flex-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky left-0 z-20">
          <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30" /> {/* Spacer Header */}
          {hours.map((hour) => (
            <div key={hour} className="h-20 text-[10px] md:text-xs text-zinc-400 font-medium text-center pt-2 relative">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Colunas dos Dias (Eixo X) */}
        <div className="flex-1 grid grid-cols-7 min-w-[800px]">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 last:border-0">
              
              {/* Header do Dia */}
              <div className={cn(
                "h-12 flex flex-col items-center justify-center border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors",
                isToday(day) ? "bg-amber-50 dark:bg-amber-900/20 border-b-amber-200" : "bg-white dark:bg-zinc-900"
              )}>
                <span className={cn("text-[10px] uppercase font-bold", isToday(day) ? "text-amber-700 dark:text-amber-500" : "text-zinc-500")}>
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-lg font-bold h-7 w-7 flex items-center justify-center rounded-full",
                  isToday(day) ? "bg-amber-500 text-white shadow-sm" : "text-zinc-700 dark:text-zinc-300"
                )}>
                  {format(day, "d")}
                </span>
              </div>

              {/* Área de Slots do Dia */}
              <div className="relative flex-1 bg-white dark:bg-zinc-900">
                {/* Linhas de Grade (Background Interativo) */}
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-20 border-b border-dashed border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer relative"
                    onClick={() => handleCreateSlot(day, hour)}
                    title={`Adicionar slot às ${hour}:00`}
                  >
                     {/* Ícone de Adicionar no Hover */}
                     <div className="hidden group-hover:flex absolute inset-0 items-center justify-center">
                        <Plus className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                     </div>
                  </div>
                ))}

                {/* Renderização dos Slots (Posicionamento Absoluto) */}
                <AnimatePresence>
                  {initialSlots
                    .filter(slot => isSameDay(new Date(slot.startTime), day))
                    .map(slot => {
                      const start = new Date(slot.startTime);
                      const startHour = start.getHours();
                      const startMin = start.getMinutes();
                      
                      // Cálculo da posição top (baseado nas horas renderizadas)
                      // Cada hora tem 80px de altura
                      // Subtraímos startHour do array 'hours' para alinhar
                      const topOffset = ((startHour - startHour) * 80) + ((startMin / 60) * 80); 
                      // Correção: Como meu array 'hours' começa em 7, preciso subtrair 7
                      const absoluteTop = ((startHour - 7) * 80) + ((startMin / 60) * 80);

                      // Se o slot estiver fora do range de visualização (ex: 22h), ignoramos
                      if (startHour < 7 || startHour > 19) return null;

                      // --- Definição de Estilos Visuais ---
                      let bgClass = "";
                      let borderClass = "";
                      let textClass = "";
                      let iconColor = "";

                      if (slot.source === 'CLINIC') {
                          if (slot.isBooked) {
                              // CLINIC OCUPADO (Cinza/Neutro)
                              bgClass = "bg-zinc-100 dark:bg-zinc-800";
                              borderClass = "border-zinc-200 dark:border-zinc-700";
                              textClass = "text-zinc-500 dark:text-zinc-400";
                              iconColor = "text-zinc-400";
                          } else {
                              // CLINIC LIVRE (Azul - Oportunidade)
                              bgClass = "bg-blue-50 dark:bg-blue-900/20";
                              borderClass = "border-blue-200 dark:border-blue-800";
                              textClass = "text-blue-700 dark:text-blue-400";
                              iconColor = "text-blue-500";
                          }
                      } else {
                          // LOCAL (Manual)
                          if (slot.isBooked) {
                              // LOCAL AGENDADO (Verde - Sucesso do Robô)
                              bgClass = "bg-emerald-100 dark:bg-emerald-900/20";
                              borderClass = "border-emerald-200 dark:border-emerald-800";
                              textClass = "text-emerald-800 dark:text-emerald-400";
                              iconColor = "text-emerald-600";
                          } else {
                              // LOCAL LIVRE (Amarelo - Aguardando)
                              bgClass = "bg-amber-100 dark:bg-amber-900/20";
                              borderClass = "border-amber-200 dark:border-amber-800";
                              textClass = "text-amber-800 dark:text-amber-400";
                              iconColor = "text-amber-600";
                          }
                      }

                      return (
                        <motion.div
                          key={slot.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={cn(
                            "absolute left-1 right-1 rounded-md border p-2 text-xs shadow-sm z-10 flex flex-col justify-between group overflow-hidden transition-all hover:brightness-95",
                            bgClass, borderClass, textClass
                          )}
                          style={{
                            top: `${absoluteTop}px`,
                            height: "38px" // Altura fixa para slots de 30min (metade de 80px - padding)
                          }}
                          onClick={(e) => e.stopPropagation()} // Evita criar slot em cima
                        >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1 font-bold">
                                <Clock className={cn("h-3 w-3", iconColor)} />
                                {format(start, "HH:mm")}
                             </div>
                             
                             {/* Indicador de Origem */}
                             {slot.source === 'CLINIC' && (
                                <div title="Sincronizado com ERP Clinic">
                                   <Link2 className="h-3 w-3 opacity-40" />
                                </div>
                             )}
                          </div>
                          
                          {/* Detalhes / Ações */}
                          <div className="flex items-end justify-between mt-1">
                             {/* Se ocupado, mostra detalhes ou 'Ocupado' */}
                             {slot.isBooked ? (
                                <span className="truncate text-[10px] opacity-80 font-medium">
                                   {slot.details || "Agendado"}
                                </span>
                             ) : (
                                <span className="text-[10px] opacity-70">Disponível</span>
                             )}

                             {/* Botão de Excluir (Apenas para Slots Manuais Livres) */}
                             {slot.source === 'LOCAL' && !slot.isBooked && (
                                <button 
                                  onClick={(e) => handleDeleteSlot(slot.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-red-600 dark:text-red-400 transition-all"
                                  title="Remover horário"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                             )}

                             {/* Cadeado para Slots Clinic (Read-only) */}
                             {slot.source === 'CLINIC' && (
                                <Lock className="h-2.5 w-2.5 opacity-30" />
                             )}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}