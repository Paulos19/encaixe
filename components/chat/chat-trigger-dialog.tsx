'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Loader2, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Keyboard,
  ChevronLeft,
  ChevronRight,
  List
} from 'lucide-react';
import { getWeekSlots, UnifiedSlot } from '@/app/actions/agenda';
import { getWaitlists } from '@/app/actions/waitlist';
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
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (listName: string, slotTime: string) => void;
}

export function ChatTriggerDialog({ open, onOpenChange, onSuccess }: ChatTriggerDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [mode, setMode] = useState<'agenda' | 'manual'>('agenda');
  const [selectedSlot, setSelectedSlot] = useState("");
  const [manualTime, setManualTime] = useState("");

  useEffect(() => {
    if (open) {
      fetchLists();
      fetchSlots();
    }
  }, [open]);

  useEffect(() => {
    if (open && mode === 'agenda') {
      fetchSlots();
    }
  }, [referenceDate, mode, open]);

  async function fetchLists() {
    setLoadingLists(true);
    try {
      const data = await getWaitlists();
      setWaitlists(data.filter((l: any) => l.isActive));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar listas.");
    } finally {
      setLoadingLists(false);
    }
  }

  async function fetchSlots() {
    setLoadingSlots(true);
    try {
      const data = await getWeekSlots(referenceDate);
      const now = new Date();
      const validSlots = data.filter(s => {
        const slotDate = new Date(s.startTime);
        return !s.isBooked && slotDate > now;
      });
      setSlots(validSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSlotTime = mode === 'manual' ? manualTime : selectedSlot;
    
    if (!selectedListId) {
      toast.error("Selecione uma lista de espera.");
      return;
    }
    if (!finalSlotTime) {
      toast.error("Defina o horário da vaga.");
      return;
    }

    const listName = waitlists.find(w => w.id === selectedListId)?.name || "Lista";
    
    onSuccess(listName, finalSlotTime);
    onOpenChange(false);
    
    setSelectedListId("");
    setSelectedSlot("");
    setManualTime("");
  };

  const uniqueOptions = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime);
    const valueToSend = format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    
    if (!acc.find(item => item.value === valueToSend)) {
      acc.push({
        id: slot.id,
        value: valueToSend,
        label: format(date, "EEEE (dd), HH:mm", { locale: ptBR }),
        source: slot.source
      });
    }
    return acc;
  }, [] as { id: string; value: string; label: string; source: string }[]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-background/95 backdrop-blur-xl border-border shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <DialogTitle>
                    {/* CORREÇÃO AQUI: props 'from' e 'to' removidas, usando className */}
                    <GradientText size="xl" className="from-amber-500 via-orange-500 to-orange-600">
                      Disparar Vaga
                    </GradientText>
                </DialogTitle>
            </div>
            <DialogDescription>
              A Silvia buscará o primeiro da fila e enviará a oferta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <List className="w-3.5 h-3.5" /> Qual lista processar?
              </Label>
              <Select onValueChange={setSelectedListId} value={selectedListId} disabled={loadingLists}>
                <SelectTrigger className="h-11 bg-muted/50 border-border focus:ring-amber-500/20">
                  <SelectValue placeholder={loadingLists ? "Carregando..." : "Selecione a lista de espera..."} />
                </SelectTrigger>
                <SelectContent>
                  {waitlists.length === 0 && !loadingLists ? (
                     <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma lista ativa encontrada</div>
                  ) : (
                    waitlists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} <span className="text-muted-foreground ml-1">({list._count?.entries || 0} p.)</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-muted-foreground">
                   <CalendarIcon className="w-3.5 h-3.5" /> Qual horário vagou?
                </Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-amber-600 hover:text-amber-500 px-2"
                  onClick={() => setMode(mode === 'agenda' ? 'manual' : 'agenda')}
                >
                  {mode === 'agenda' ? (
                    <span className="flex items-center gap-1"><Keyboard className="w-3 h-3"/> Digitar Manual</span>
                  ) : (
                    <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Usar Agenda</span>
                  )}
                </Button>
              </div>

              {mode === 'agenda' && (
                <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-lg border border-border/50 mb-2">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReferenceDate(addDays(referenceDate, -7))}>
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"ghost"} className="h-7 text-xs font-medium w-[140px]">
                        {format(referenceDate, "d 'de' MMMM", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={referenceDate}
                        onSelect={(d) => d && setReferenceDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReferenceDate(addDays(referenceDate, 7))}>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {loadingSlots ? (
                 <div className="h-11 w-full rounded-md bg-muted/50 border border-border animate-pulse flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-3 w-3 animate-spin"/> Buscando horários...
                 </div>
              ) : mode === 'agenda' ? (
                <Select onValueChange={setSelectedSlot} value={selectedSlot}>
                  <SelectTrigger className="h-11 bg-muted/50 border-border focus:ring-amber-500/20">
                    <SelectValue placeholder={uniqueOptions.length > 0 ? "Selecione um horário livre..." : "Sem horários livres esta semana"} />
                  </SelectTrigger>
                  <SelectContent>
                      {uniqueOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", opt.source === 'CLINIC' ? "bg-blue-500" : "bg-amber-500")}/>
                            <span className="capitalize">{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative group">
                  <Input
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    placeholder="Ex: Amanhã às 14:30"
                    className="h-11 bg-muted/50 border-border focus:ring-amber-500/20 pl-4"
                    autoFocus
                  />
                </div>
              )}
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
               <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <p className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
                 Ao confirmar, a <strong>Silvia</strong> irá assumir o controle. Ela notificará o paciente e aguardará a resposta no WhatsApp.
               </p>
            </div>

          </div>

          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading || !selectedListId || (mode === 'agenda' && !selectedSlot) || (mode === 'manual' && !manualTime)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold h-11 shadow-lg shadow-amber-500/20 border-0"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                    Pedir para Silvia Disparar <Sparkles className="h-4 w-4" />
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}