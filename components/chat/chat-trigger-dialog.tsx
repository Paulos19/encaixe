'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Loader2, Megaphone, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Keyboard, Sparkles } from 'lucide-react';
import { getWaitlistsOptions, triggerManualSlot } from '@/app/actions/waitlist';
import { getWeekSlots, UnifiedSlot } from '@/app/actions/agenda';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ChatTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (listName: string, slotTime: string, mode: 'direct' | 'ai') => void; // Update signature
}

export function ChatTriggerDialog({ open, onOpenChange, onSuccess }: ChatTriggerDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Listas
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [fetchingLists, setFetchingLists] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");

  // Agenda / Horário
  const [mode, setMode] = useState<'agenda' | 'manual'>('agenda');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [manualSlotTime, setManualSlotTime] = useState("");

  // Inicialização
  useEffect(() => {
    if (open) {
      setFetchingLists(true);
      getWaitlistsOptions()
        .then(setLists)
        .finally(() => setFetchingLists(false));
    }
  }, [open]);

  // Busca Slots
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
      // Filtra futuros e não agendados
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

  // Deduplicação de Slots para o Select
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

  const getFinalSlotTime = () => mode === 'agenda' ? selectedSlot : manualSlotTime;

  // AÇÃO 1: DISPARO DIRETO (Backend Action)
  const handleDirectTrigger = async () => {
    const time = getFinalSlotTime();
    if (!selectedListId || !time) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('waitlistId', selectedListId);
    formData.append('slotTime', time);

    const result = await triggerManualSlot(formData);
    setLoading(false);

    if (result?.success) {
      const listName = lists.find(l => l.id === selectedListId)?.name || "Lista";
      onSuccess(listName, time, 'direct');
      onOpenChange(false);
      resetForm();
    } else {
      toast.error(result?.error || "Erro ao disparar vaga.");
    }
  };

  // AÇÃO 2: PEDIR PARA SILVIA (Chat Request)
  const handleAskSilvia = () => {
    const time = getFinalSlotTime();
    if (!selectedListId || !time) return;

    const listName = lists.find(l => l.id === selectedListId)?.name || "Lista";
    onSuccess(listName, time, 'ai');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setManualSlotTime("");
    setSelectedSlot("");
    setSelectedListId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100 text-amber-600">
               <Megaphone className="w-4 h-4" />
            </div>
            <DialogTitle>Disparar Vaga</DialogTitle>
          </div>
          <DialogDescription>
            Escolha uma lista e um horário vago para ofertar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          
          {/* 1. SELEÇÃO DE LISTA */}
          <div className="space-y-2">
            <Label>Lista de Espera</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId} disabled={fetchingLists}>
              <SelectTrigger>
                <SelectValue placeholder={fetchingLists ? "Carregando..." : "Selecione a lista..."} />
              </SelectTrigger>
              <SelectContent>
                {lists.length === 0 && !fetchingLists ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma lista disponível.</div>
                ) : (
                  lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 2. SELEÇÃO DE HORÁRIO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Horário da Vaga</Label>
              <Button 
                type="button" variant="ghost" size="sm" 
                className="h-5 text-[10px] text-primary px-1 hover:bg-transparent hover:underline"
                onClick={() => setMode(mode === 'agenda' ? 'manual' : 'agenda')}
              >
                {mode === 'agenda' ? 'Digitar Manualmente' : 'Buscar na Agenda'}
              </Button>
            </div>

            {mode === 'agenda' ? (
              <div className="space-y-2">
                {/* Navegação de Data */}
                <div className="flex items-center justify-between bg-muted/30 p-1.5 rounded-md border">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReferenceDate(addDays(referenceDate, -7))}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-6 text-xs font-normal w-[140px]">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {format(referenceDate, "d 'de' MMMM", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar mode="single" selected={referenceDate} onSelect={(d) => d && setReferenceDate(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReferenceDate(addDays(referenceDate, 7))}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>

                {/* Select de Slots */}
                <Select value={selectedSlot} onValueChange={setSelectedSlot} disabled={loadingSlots}>
                  <SelectTrigger className={cn("h-10", !selectedSlot && "text-muted-foreground")}>
                    <SelectValue placeholder={loadingSlots ? "Buscando..." : (uniqueOptions.length ? "Selecione o horário..." : "Sem horários livres")} />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>
                          <span className="capitalize">{opt.label}</span>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Input 
                placeholder="Ex: Amanhã às 15:30" 
                value={manualSlotTime}
                onChange={(e) => setManualSlotTime(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          
          {/* Botão AI Agent */}
          <Button 
            variant="secondary" 
            onClick={handleAskSilvia}
            disabled={loading || !selectedListId || (mode === 'agenda' ? !selectedSlot : !manualSlotTime)}
            className="gap-2"
            title="Preenche o chat para você revisar antes de enviar"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            Pedir para Silvia
          </Button>

          {/* Botão Direct Action */}
          <Button 
            onClick={handleDirectTrigger} 
            disabled={loading || !selectedListId || (mode === 'agenda' ? !selectedSlot : !manualSlotTime)}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Disparar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}