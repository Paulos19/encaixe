"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, CalendarSync, User, Lock, ArrowDownToLine, Grid3X3, CalendarRange, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSlotAction, deleteSlotAction, getSlots, UnifiedSlot } from "@/app/actions/agenda";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"; // Importe CalendarDayButton
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CalendarGridProps {
  initialSlots: UnifiedSlot[];
}

type ViewSource = 'MANUAL' | 'CLINIC';
type DisplayMode = 'WEEK' | 'MONTH';

export function CalendarGrid({ initialSlots }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<UnifiedSlot[]>(initialSlots);
  
  // Controles de Visualização
  const [viewSource, setViewSource] = useState<ViewSource>('MANUAL');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('WEEK');
  
  // Seleção no modo Mês
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  
  // Estado para criar horário manual (Modo Mês)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSlotHour, setNewSlotHour] = useState("09");
  const [newSlotMinute, setNewSlotMinute] = useState("00");

  // --- BUSCA DE DADOS ---
  useEffect(() => {
    async function fetchSlots() {
      setIsFetching(true);
      try {
        const newSlots = await getSlots(currentDate, displayMode === 'WEEK' ? 'week' : 'month');
        setSlots(newSlots);
      } catch (error) {
        toast.error("Erro ao atualizar agenda.");
      } finally {
        setIsFetching(false);
      }
    }
    
    const timer = setTimeout(fetchSlots, 300);
    return () => clearTimeout(timer);
  }, [currentDate, displayMode]);

  // Configuração da Semana (Grid)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const startHour = 7;
  const endHour = 19;
  const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => i + startHour);

  // Filtragem Global
  const filteredSlots = slots.filter(slot => {
    if (viewSource === 'MANUAL') return slot.source === 'LOCAL';
    if (viewSource === 'CLINIC') return slot.source === 'CLINIC';
    return false;
  });

  // Ações
  const handleCreateSlot = async (day: Date, hour: number, minute: number = 0) => {
    if (viewSource !== 'MANUAL') return;
    setIsMutating(true);
    const result = await createSlotAction(day, hour, minute);
    setIsMutating(false);
    
    if (result.error) toast.error(result.error);
    else {
      toast.success("Horário criado!");
      refreshData();
      setIsCreateOpen(false);
    }
  };

  const handleImportSlot = async (slot: UnifiedSlot) => {
    if (slot.source !== 'CLINIC' || slot.isBooked) return;
    setIsMutating(true);
    const start = new Date(slot.startTime);
    const result = await createSlotAction(start, getHours(start), getMinutes(start));
    if (result.error) toast.error("Erro ao importar.");
    else {
      toast.success("Importado com sucesso!");
      setViewSource('MANUAL');
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

  const refreshData = async () => {
    const newSlots = await getSlots(currentDate, displayMode === 'WEEK' ? 'week' : 'month');
    setSlots(newSlots);
  };

  const slotsForSelectedDay = filteredSlots.filter(s => isSameDay(new Date(s.startTime), selectedDay));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
      
      {/* LOADING OVERLAY */}
      {(isFetching || isMutating) && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-6">
             <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
             <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
               {isFetching ? "Atualizando..." : "Salvando..."}
             </span>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Navegação de Data */}
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold capitalize text-zinc-800 dark:text-zinc-100 min-w-[200px]">
              {format(displayMode === 'WEEK' ? startDate : currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(displayMode === 'WEEK' ? addDays(currentDate, -7) : addDays(currentDate, -30))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(displayMode === 'WEEK' ? addDays(currentDate, 7) : addDays(currentDate, 30))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Switch de Modo de Visualização */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setDisplayMode('WEEK')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  displayMode === 'WEEK' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Grid3X3 className="h-4 w-4" /> Grid
              </button>
              <button
                onClick={() => setDisplayMode('MONTH')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  displayMode === 'MONTH' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <CalendarRange className="h-4 w-4" /> Lista
              </button>
            </div>

            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

            {/* Switch de Fonte de Dados */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setViewSource('MANUAL')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewSource === 'MANUAL' ? "bg-white dark:bg-zinc-800 text-amber-600 shadow-sm" : "text-zinc-500"
                )}
              >
                <User className="h-4 w-4" /> Manual
              </button>
              <button
                onClick={() => setViewSource('CLINIC')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewSource === 'CLINIC' ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm" : "text-zinc-500"
                )}
              >
                <CalendarSync className="h-4 w-4" /> Clinic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* MODO GRID (SEMANA) */}
        {displayMode === 'WEEK' && (
          <div className="flex flex-col h-full overflow-y-auto scroll-smooth">
            <div className="flex">
              {/* Coluna Horas */}
              <div className="w-14 flex-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky left-0 z-20">
                <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-zinc-50 dark:bg-zinc-900 z-30" />
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
                      "h-10 flex flex-col items-center justify-center border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 transition-colors",
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
                            viewSource === 'MANUAL' && "hover:bg-zinc-50 cursor-pointer group"
                          )}
                          onClick={() => handleCreateSlot(day, hour)}
                        >
                          {viewSource === 'MANUAL' && (
                            <div className="hidden group-hover:flex absolute inset-0 items-center justify-center">
                               <Plus className="h-5 w-5 text-zinc-300" />
                            </div>
                          )}
                        </div>
                      ))}

                      {filteredSlots
                        .filter(slot => isSameDay(new Date(slot.startTime), day))
                        .map(slot => {
                          const start = new Date(slot.startTime);
                          const startHour = getHours(start);
                          const startMin = getMinutes(start);
                          if (startHour < 7 || startHour > 19) return null;
                          const topPosition = ((startHour - 7) * 80) + ((startMin / 60) * 80);
                          const isClinic = slot.source === 'CLINIC';
                          const isBooked = slot.isBooked;

                          return (
                            <div
                              key={slot.id}
                              onClick={() => !isBooked && isClinic && handleImportSlot(slot)}
                              className={cn(
                                "absolute left-1 right-1 rounded-md border p-1.5 text-xs shadow-sm z-10 flex flex-col justify-between group overflow-hidden transition-all h-[38px]",
                                isClinic 
                                  ? (isBooked ? "bg-zinc-100 border-zinc-200 text-zinc-400 opacity-70 cursor-not-allowed" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer")
                                  : (isBooked ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-amber-100 border-amber-200 text-amber-800 cursor-default")
                              )}
                              style={{ top: `${topPosition}px` }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 font-bold">
                                  <Clock className="h-3 w-3 opacity-70" /> {format(start, "HH:mm")}
                                </div>
                                {!isClinic && !isBooked && (
                                  <button onClick={(e) => handleDeleteSlot(slot.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                                {isClinic && !isBooked && <ArrowDownToLine className="h-3 w-3 opacity-50 group-hover:opacity-100" />}
                                {isClinic && isBooked && <Lock className="h-3 w-3 opacity-30" />}
                              </div>
                              <div className="text-[10px] truncate opacity-80 font-medium">
                                {isClinic && !isBooked ? "Importar" : slot.details || "Disponível"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODO FRIENDLY (CALENDAR + LISTA) */}
        {displayMode === 'MONTH' && (
          <div className="flex h-full">
            {/* Esquerda: Calendário de Navegação */}
            <div className="w-[350px] border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col bg-zinc-50/30 dark:bg-zinc-900/10">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => d && setSelectedDay(d)}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="rounded-md border shadow-sm bg-white dark:bg-zinc-950 p-3 w-full"
                
                // --- CUSTOMIZAÇÃO DE COMPONENTES DO DIA (CORREÇÃO) ---
                components={{
                  DayButton: (props: any) => {
                    const { day } = props;
                    const date = day.date;
                    
                    // Lógica para determinar os pontos
                    const daySlots = filteredSlots.filter(s => isSameDay(new Date(s.startTime), date));
                    const hasAvailable = daySlots.some(s => !s.isBooked);
                    const hasBooked = daySlots.some(s => s.isBooked);

                    return (
                      <CalendarDayButton {...props}>
                        <div className="relative flex items-center justify-center w-full h-full">
                          {/* Renderiza o conteúdo original (número do dia) */}
                          {props.children}
                          
                          {/* Indicadores Visuais */}
                          <div className="absolute bottom-1 flex gap-0.5">
                            {hasAvailable && (
                              <div className="w-1 h-1 rounded-full bg-amber-500" title="Horários disponíveis" />
                            )}
                            {hasBooked && (
                              <div className="w-1 h-1 rounded-full bg-emerald-500" title="Agendamentos confirmados" />
                            )}
                          </div>
                        </div>
                      </CalendarDayButton>
                    );
                  }
                }}
              />
              
              <div className="mt-6 space-y-3">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Legenda</div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Horários Disponíveis
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Agendados
                </div>
              </div>
            </div>

            {/* Direita: Lista de Slots do Dia */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                    {isToday(selectedDay) && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Hoje</Badge>}
                  </h3>
                  <p className="text-sm text-zinc-500 capitalize">{format(selectedDay, "EEEE", { locale: ptBR })}</p>
                </div>

                {viewSource === 'MANUAL' && (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                        <Plus className="w-4 h-4" /> Novo Horário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Horário em {format(selectedDay, "dd/MM")}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Hora</Label>
                            <Select value={newSlotHour} onValueChange={setNewSlotHour}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {hours.map(h => <SelectItem key={h} value={h.toString().padStart(2, '0')}>{h}:00</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Minuto</Label>
                            <Select value={newSlotMinute} onValueChange={setNewSlotMinute}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="00">00</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleCreateSlot(selectedDay, parseInt(newSlotHour), parseInt(newSlotMinute))}>
                          Confirmar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {slotsForSelectedDay.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <CalendarRange className="h-12 w-12 mb-4 opacity-20" />
                    <p>Nenhum horário registrado.</p>
                    {viewSource === 'MANUAL' && <p className="text-sm">Clique em "Novo Horário" para adicionar.</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotsForSelectedDay.map(slot => {
                      const isClinic = slot.source === 'CLINIC';
                      const isBooked = slot.isBooked;
                      return (
                        <div 
                          key={slot.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            isClinic 
                              ? (isBooked ? "bg-zinc-50 border-zinc-200 opacity-60" : "bg-blue-50 border-blue-200 hover:shadow-md cursor-pointer group")
                              : (isBooked ? "bg-emerald-50 border-emerald-200" : "bg-white border-zinc-200 hover:border-amber-300 hover:shadow-sm")
                          )}
                          onClick={() => !isBooked && isClinic && handleImportSlot(slot)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                              isClinic 
                                ? (isBooked ? "bg-zinc-200 text-zinc-500" : "bg-blue-100 text-blue-700")
                                : (isBooked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")
                            )}>
                              {format(new Date(slot.startTime), "HH:mm")}
                            </div>
                            <div>
                              <p className={cn("font-medium text-sm", isBooked ? "text-zinc-700" : "text-zinc-900")}>
                                {isBooked ? "Ocupado" : "Disponível"}
                              </p>
                              <p className="text-xs text-zinc-500 flex items-center gap-1">
                                {isClinic ? <CalendarSync className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                {isClinic ? "Clinic Web" : "Manual"}
                              </p>
                            </div>
                          </div>

                          {/* Ações na Lista */}
                          {!isClinic && !isBooked && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {isClinic && !isBooked && (
                            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}