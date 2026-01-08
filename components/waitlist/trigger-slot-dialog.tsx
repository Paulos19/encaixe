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
  Calendar, 
  Keyboard 
} from 'lucide-react';
import { triggerManualSlot } from '@/app/actions/waitlist'; // Use a action correta
import { getWeekSlots } from '@/app/actions/agenda'; // Importe a action da agenda
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
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [mode, setMode] = useState<'agenda' | 'manual'>('agenda'); // Alternar entre select e input
  const [selectedSlot, setSelectedSlot] = useState("");

  // Carregar slots ao abrir
  useEffect(() => {
    if (open) {
      setLoadingSlots(true);
      getWeekSlots(new Date())
        .then((data) => {
          const validSlots = data.filter(s => !s.isBooked && new Date(s.startTime) > new Date());
          setSlots(validSlots);
          // Se não tiver slots, vai direto pro manual
          if (validSlots.length === 0) setMode('manual');
          else setMode('agenda');
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Pega valor do input manual OU do select state
    const formData = new FormData(event.currentTarget);
    const manualInput = formData.get('slotTimeManual') as string;
    const finalSlotTime = mode === 'manual' ? manualInput : selectedSlot;

    if (!finalSlotTime) {
      toast.error("Por favor, selecione ou digite um horário.");
      return;
    }

    setLoading(true);

    // Prepara payload correto
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* --- BOTÃO DE DETONAÇÃO PREMIUM --- */}
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
          {/* Background Animado (Shimmer) */}
          {!disabled && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </div>
          )}

          {/* Glow Pulsante */}
          {!disabled && (
            <span className="absolute -inset-1 rounded-full bg-amber-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          )}

          {/* Conteúdo do Botão */}
          <div className="relative z-10 flex items-center gap-2">
            <div className={cn("p-1 rounded-full bg-white/10 backdrop-blur-sm", !disabled && "text-amber-100")}>
                <Zap className={cn("h-4 w-4", isHovered && !disabled && "fill-current animate-pulse")} />
            </div>
            <span className="tracking-wide text-sm">
              DISPARAR VAGA
            </span>
          </div>

          {/* Badge 'Live' */}
          {!disabled && (
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-amber-600"></span>
             </span>
          )}
        </motion.button>
      </DialogTrigger>

      {/* --- O MODAL --- */}
      <DialogContent className="sm:max-w-[425px] bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl shadow-2xl">
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
              O sistema buscará automaticamente o próximo da fila e enviará uma oferta via WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="slotTime" className="text-zinc-300 font-medium">
                  Qual horário vagou?
                </Label>
                
                {/* Toggle entre Modos */}
                {slots.length > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-amber-500 hover:text-amber-400 px-2"
                    onClick={() => setMode(mode === 'agenda' ? 'manual' : 'agenda')}
                  >
                    {mode === 'agenda' ? (
                      <span className="flex items-center gap-1"><Keyboard className="w-3 h-3"/> Digitar Manual</span>
                    ) : (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Usar Agenda</span>
                    )}
                  </Button>
                )}
              </div>

              {/* INPUT CONDICIONAL */}
              {loadingSlots ? (
                 <div className="h-12 w-full rounded-md bg-zinc-900/50 border border-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-500">
                    Carregando agenda...
                 </div>
              ) : mode === 'agenda' && slots.length > 0 ? (
                // MODO SELEÇÃO (Agenda)
                <Select onValueChange={setSelectedSlot} value={selectedSlot}>
                  <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-700 text-zinc-100 focus:ring-amber-500/20 focus:border-amber-500/50">
                    <SelectValue placeholder="Selecione um horário livre" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    {slots.map((slot) => {
                       const date = new Date(slot.startTime);
                       const label = format(date, "EEEE (dd), 'às' HH:mm", { locale: ptBR });
                       // Formata a string bonita para enviar no Whats (Ex: "Quinta-feira (25), às 14:00")
                       const valueToSend = format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
                       
                       return (
                         <SelectItem key={slot.id} value={valueToSend}>
                           <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-amber-500"/>
                              <span className="capitalize">{label}</span>
                           </div>
                         </SelectItem>
                       );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                // MODO MANUAL (Fallback)
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
                Essa informação será enviada instantaneamente para o paciente.
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