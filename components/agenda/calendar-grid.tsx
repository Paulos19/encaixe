"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, CalendarSync, User, Lock, ArrowDownToLine, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSlotAction, deleteSlotAction, getWeekSlots, UnifiedSlot } from "@/app/actions/agenda";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface CalendarGridProps {
  initialSlots: UnifiedSlot[];
}

type ViewMode = 'MANUAL' | 'CLINIC';

export function CalendarGrid({ initialSlots }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<UnifiedSlot[]>(initialSlots); // Estado local dos slots
  const [viewMode, setViewMode] = useState<ViewMode>('MANUAL');
  
  // Dois estados de loading: um para navegação (fetch) e outro para ações (criar/importar)
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  
  // --- EFEITO DE NAVEGAÇÃO ---
  // Sempre que mudar a data, busca os slots novos no servidor
  useEffect(() => {
    async function fetchSlots() {
      setIsFetching(true);
      try {
        const newSlots = await getWeekSlots(currentDate);
        setSlots(newSlots);
      } catch (error) {
        toast.error("Erro ao atualizar agenda.");
      } finally {
        setIsFetching(false);
      }
    }
    
    // Pequeno debounce para evitar flicker se o usuário clicar rápido
    const timer = setTimeout(fetchSlots, 300);
    return () => clearTimeout(timer);
  }, [currentDate]); // Dependência: data atual

  // Configuração da Semana
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Configuração das Horas
  const startHour = 7;
  const endHour = 19;
  const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => i + startHour);

  // Filtragem
  const filteredSlots = slots.filter(slot => {
    if (viewMode === 'MANUAL') return slot.source === 'LOCAL';
    if (viewMode === 'CLINIC') return slot.source === 'CLINIC';
    return false;
  });

  // Ações
  const handleCreateSlot = async (day: Date, hour: number) => {
    if (viewMode !== 'MANUAL') return;
    setIsMutating(true);
    const result = await createSlotAction(day, hour, 0);
    setIsMutating(false);
    
    if (result.error) toast.error(result.error);
    else {
      toast.success("Horário criado!");
      refreshData(); // Atualiza a tela
    }
  };

  const handleImportSlot = async (slot: UnifiedSlot) => {
    if (slot.source !== 'CLINIC' || slot.isBooked) return;
    
    setIsMutating(true);
    const start = new Date(slot.startTime);
    const result = await createSlotAction(start, getHours(start), getMinutes(start));
    
    if (result.error) {
      toast.error("Erro ao importar.");
    } else {
      toast.success("Importado com sucesso!");
      setViewMode('MANUAL');
      refreshData();
    }
    setIsMutating(false);
  };

  const handleDeleteSlot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMutating(true);
    const result = await deleteSlotAction(id);
    setIsMutating(false);
    
    if (result.error) toast.error(result.error);
    else {
      toast.success("Removido.");
      refreshData();
    }
  };

  // Helper para forçar refresh manual sem mudar data
  const refreshData = async () => {
    const newSlots = await getWeekSlots(currentDate);
    setSlots(newSlots);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
      
      {/* LOADING OVERLAY (GLOBAL) */}
      {(isFetching || isMutating) && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-6">
             <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
             <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
               {isFetching ? "Carregando agenda..." : "Salvando..."}
             </span>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold capitalize text-zinc-800 dark:text-zinc-100 min-w-[200px]">
              {format(startDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setViewMode('MANUAL')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all relative z-10",
                viewMode === 'MANUAL' 
                  ? "bg-white dark:bg-zinc-800 text-amber-600 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <User className="h-4 w-4" />
              Manual
            </button>
            <button
              onClick={() => setViewMode('CLINIC')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all relative z-10",
                viewMode === 'CLINIC' 
                  ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <CalendarSync className="h-4 w-4" />
              Integração Clinic
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {viewMode === 'MANUAL' ? (
            <>
              <Badge variant="outline" className="bg-amber-100/50 text-amber-700 border-amber-200 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Disponível
              </Badge>
              <Badge variant="outline" className="bg-emerald-100/50 text-emerald-700 border-emerald-200 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Agendado
              </Badge>
            </>
          ) : (
            <>
              <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> ERP Livre (Clique para importar)
              </Badge>
              <Badge variant="outline" className="bg-zinc-100/50 text-zinc-600 border-zinc-200 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-400" /> ERP Ocupado
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="flex flex-1 overflow-y-auto relative scroll-smooth">
        {/* Coluna Horas */}
        <div className="w-14 flex-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky left-0 z-10">
          <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-zinc-50 dark:bg-zinc-900 z-20" />
          {hours.map((hour) => (
            <div key={hour} className="h-20 text-[10px] text-zinc-400 font-medium text-center pt-2 relative">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Coluna Dias */}
        <div className="flex-1 grid grid-cols-7 min-w-[800px]">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 last:border-0 relative">
              <div className={cn(
                "h-10 flex flex-col items-center justify-center border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors",
                isToday(day) ? "bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm border-b-amber-200" : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
              )}>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">{format(day, "EEE", { locale: ptBR })}</span>
                  <span className={cn("text-sm font-bold", isToday(day) ? "text-amber-600" : "text-zinc-700")}>{format(day, "d")}</span>
                </div>
              </div>

              <div className="relative flex-1 bg-white dark:bg-zinc-950">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className={cn(
                      "h-20 border-b border-dashed border-zinc-100 dark:border-zinc-800 transition-colors relative",
                      viewMode === 'MANUAL' && "hover:bg-zinc-50 cursor-pointer group"
                    )}
                    onClick={() => handleCreateSlot(day, hour)}
                  >
                     {viewMode === 'MANUAL' && (
                       <div className="hidden group-hover:flex absolute inset-0 items-center justify-center">
                          <Plus className="h-5 w-5 text-zinc-300" />
                       </div>
                     )}
                  </div>
                ))}

                <AnimatePresence>
                  {filteredSlots
                    .filter(slot => isSameDay(new Date(slot.startTime), day))
                    .map(slot => {
                      const start = new Date(slot.startTime);
                      const startHour = getHours(start);
                      const startMin = getMinutes(start);
                      
                      if (startHour < startHour || startHour > endHour) return null;

                      const topPosition = ((startHour - startHour) * 80) + ((startMin / 60) * 80);

                      const isClinic = slot.source === 'CLINIC';
                      const isBooked = slot.isBooked;

                      let styles = "";
                      if (isClinic) {
                        if (isBooked) styles = "bg-zinc-100 border-zinc-200 text-zinc-400 opacity-70 cursor-not-allowed";
                        else styles = "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer hover:shadow-md";
                      } else {
                        if (isBooked) styles = "bg-emerald-100 border-emerald-200 text-emerald-800";
                        else styles = "bg-amber-100 border-amber-200 text-amber-800 cursor-default";
                      }

                      return (
                        <motion.div
                          key={slot.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => !isBooked && isClinic && handleImportSlot(slot)}
                          className={cn(
                            "absolute left-1 right-1 rounded-md border p-1.5 text-xs shadow-sm z-10 flex flex-col justify-between group overflow-hidden transition-all",
                            styles
                          )}
                          style={{ top: `${topPosition}px`, height: "38px" }}
                        >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1 font-bold">
                                <Clock className="h-3 w-3 opacity-70" />
                                {format(start, "HH:mm")}
                             </div>
                             
                             {!isClinic && !isBooked && (
                                <button onClick={(e) => handleDeleteSlot(slot.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-200 rounded text-red-600 transition-all">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                             )}

                             {isClinic && !isBooked && (
                               <ArrowDownToLine className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                             )}

                             {isClinic && isBooked && <Lock className="h-3 w-3 opacity-30" />}
                          </div>
                          
                          <div className="text-[10px] truncate opacity-80 font-medium">
                            {isClinic && !isBooked ? "Importar" : slot.details || "Disponível"}
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