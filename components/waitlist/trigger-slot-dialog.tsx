'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Keyboard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { triggerManualSlot } from '@/app/actions/waitlist';
import { getWeekSlots, UnifiedSlot } from '@/app/actions/agenda';
import { cn } from '@/lib/utils';
import { GradientText } from '@/components/ui/gradient-text';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; 
import { toast } from 'sonner';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TriggerDialogProps {
  waitlistId: string;
  disabled?: boolean;
}

export function TriggerSlotDialog({ waitlistId, disabled }: TriggerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Estados da Agenda
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [mode, setMode] = useState<'agenda' | 'manual'>('agenda');
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => {
    if (open && mode === 'agenda') {
      fetchSlots();
    }
  }, [open, referenceDate, mode]);

  async function fetchSlots() {
    setLoadingSlots(true);
    try {
      const data = await getWeekSlots(referenceDate);
      const now = new Date();
      
      // Filtra: Apenas não agendados E futuros
      const validSlots = data.filter(s => {
        const slotDate = new Date(s.startTime);
        return !s.isBooked && slotDate > now;
      });

      setSlots(validSlots);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar agenda.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const manualInput = formData.get('slotTimeManual') as string;
    const finalSlotTime = mode === 'manual' ? manualInput : selectedSlot;

    if (!finalSlotTime) {
      toast.error("Por favor, selecione ou digite um horário.");
      return;
    }

    setLoading(true);

    const payload = new FormData();
    payload.append('waitlistId', waitlistId);
    payload.append('slotTime', finalSlotTime);

    const result = await triggerManualSlot(payload);
    
    setLoading(false);
    
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success("Disparo iniciado com sucesso!");
      setOpen(false);
      setSelectedSlot("");
    }
  }

  // --- LÓGICA DE DEDUPLICAÇÃO ---
  // Agrupa slots que resultariam na mesma string de horário
  const uniqueOptions = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime);
    // A chave é o valor exato que será enviado (e exibido)
    const valueToSend = format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    
    // Se já existe, não adiciona de novo (prioriza o primeiro que aparecer, geralmente o Local devido à ordenação ou ordem de fetch)
    if (!acc.find(item => item.value === valueToSend)) {
      acc.push({
        id: slot.id, // Mantém o ID original para a key do React
        value: valueToSend,
        label: format(date, "EEEE (dd), HH:mm", { locale: ptBR }),
        source: slot.source
      });
    }
    return acc;
  }, [] as { id: string; value: string; label: string; source: string }[]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* BOTÃO DE DISPARO */}
        <motion.button
          disabled={disabled}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={cn(
            "relative group flex items-center gap-3 px-6 py-2.5 rounded-full font-bold text-white shadow-xl transition-all duration-300 outline-none focus:ring-2 focus:ring-amber-500/50",
            disabled 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700" 
              : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.6)] border border-amber-400/20"
          )}
        >
          {!disabled && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </div>
          )}
          {!disabled && (
            <span className="absolute -inset-1 rounded-full bg-amber-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <div className={cn("p-1 rounded-full bg-white/10 backdrop-blur-sm", !disabled && "text-amber-100")}>
                <Zap className={cn("h-4 w-4", isHovered && !disabled && "fill-current animate-pulse")} />
            </div>
            <span className="tracking-wide text-sm">DISPARAR VAGA</span>
          </div>
          {!disabled && (
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-amber-600"></span>
             </span>
          )}
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <DialogTitle>
                    <GradientText size="xl">Encontrar Paciente</GradientText>
                </DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400">
              O sistema ofertará a vaga. Escolha um horário da agenda ou digite.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              
              {/* CABEÇALHO DO INPUT */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-medium">Qual horário vagou?</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-amber-500 hover:text-amber-400 px-2 hover:bg-amber-950/30"
                    onClick={() => setMode(mode === 'agenda' ? 'manual' : 'agenda')}
                  >
                    {mode === 'agenda' ? (
                      <span className="flex items-center gap-1"><Keyboard className="w-3 h-3"/> Digitar Manual</span>
                    ) : (
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Usar Agenda</span>
                    )}
                  </Button>
                </div>

                {/* CONTROLES DE DATA */}
                {mode === 'agenda' && (
                  <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 mb-1">
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReferenceDate(addDays(referenceDate, -7))}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"ghost"}
                          className={cn(
                            "h-6 justify-start text-left font-normal text-xs text-zinc-300 w-[140px]",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {format(referenceDate, "d 'de' MMMM", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="center">
                        <Calendar
                          mode="single"
                          selected={referenceDate}
                          onSelect={(d) => d && setReferenceDate(d)}
                          initialFocus
                          className="dark"
                        />
                      </PopoverContent>
                    </Popover>

                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReferenceDate(addDays(referenceDate, 7))}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* INPUT PRINCIPAL */}
              {loadingSlots ? (
                 <div className="h-12 w-full rounded-md bg-zinc-900/50 border border-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-500 gap-2">
                    <Loader2 className="h-3 w-3 animate-spin"/> Buscando na agenda...
                 </div>
              ) : mode === 'agenda' ? (
                
                // MODO SELEÇÃO (Com Deduplicação)
                <Select onValueChange={setSelectedSlot} value={selectedSlot}>
                  <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-700 text-zinc-100 focus:ring-amber-500/20 focus:border-amber-500/50">
                    <SelectValue placeholder={uniqueOptions.length > 0 ? "Selecione um horário livre..." : "Nenhum horário nesta semana"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-[200px]">
                    {uniqueOptions.length === 0 ? (
                      <div className="p-2 text-xs text-center text-zinc-500">
                        Nada encontrado. Tente outra semana ou use o modo manual.
                      </div>
                    ) : (
                      uniqueOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", opt.source === 'CLINIC' ? "bg-blue-500" : "bg-amber-500")}/>
                            <span className="capitalize">{opt.label}</span>
                            {opt.source === 'CLINIC' && <span className="text-[10px] text-zinc-500 ml-1">(Clinic)</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

              ) : (
                
                // MODO MANUAL
                <div className="relative group">
                  <Input
                    id="slotTimeManual"
                    name="slotTimeManual"
                    placeholder="Ex: Amanhã às 14:30"
                    className="bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 pl-4 h-12 text-lg transition-all"
                    autoFocus
                    required={mode === 'manual'}
                  />
                  <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-transparent group-hover:ring-white/10 pointer-events-none" />
                </div>
              )}

              <p className="text-[11px] text-amber-500/80 flex items-center gap-1.5 bg-amber-500/5 p-2 rounded-md border border-amber-500/10">
                <Zap className="h-3 w-3" />
                Esta mensagem será enviada agora para o 1º da fila.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading || (mode === 'agenda' && !selectedSlot)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold h-11 shadow-lg shadow-amber-900/20 border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando Fila...
                </>
              ) : (
                <span className="flex items-center gap-2">
                    Confirmar Disparo <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}