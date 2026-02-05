'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Loader2, Megaphone } from 'lucide-react';
import { getWaitlistsOptions, triggerManualSlot } from '@/app/actions/waitlist';
import { toast } from 'sonner';

interface ChatTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (waitlistName: string, slotTime: string) => void;
}

export function ChatTriggerDialog({ open, onOpenChange, onSuccess }: ChatTriggerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingLists, setFetchingLists] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  
  // Form State
  const [selectedListId, setSelectedListId] = useState("");
  const [slotTime, setSlotTime] = useState("");

  // Busca as listas ao abrir o dialog
  useEffect(() => {
    if (open) {
      setFetchingLists(true);
      getWaitlistsOptions()
        .then(setLists)
        .finally(() => setFetchingLists(false));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedListId || !slotTime) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('waitlistId', selectedListId);
    formData.append('slotTime', slotTime);

    const result = await triggerManualSlot(formData);
    setLoading(false);

    if (result?.success) {
      const listName = lists.find(l => l.id === selectedListId)?.name || "Lista";
      onSuccess(listName, slotTime);
      onOpenChange(false);
      // Reset
      setSlotTime("");
      setSelectedListId("");
    } else {
      toast.error(result?.error || "Erro ao disparar vaga.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100 text-amber-600">
               <Megaphone className="w-4 h-4" />
            </div>
            <DialogTitle>Disparar Vaga</DialogTitle>
          </div>
          <DialogDescription>
            A Silvia vai notificar o próximo paciente da fila selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* Seleção de Lista */}
          <div className="space-y-2">
            <Label>Qual lista usar?</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId} disabled={fetchingLists}>
              <SelectTrigger>
                <SelectValue placeholder={fetchingLists ? "Carregando..." : "Selecione a lista"} />
              </SelectTrigger>
              <SelectContent>
                {lists.length === 0 && !fetchingLists ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma lista criada.</div>
                ) : (
                  lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Input de Horário */}
          <div className="space-y-2">
            <Label>Qual o horário vago?</Label>
            <Input 
              placeholder="Ex: Amanhã às 15:30" 
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Descreva como você quer que apareça na mensagem (ex: "Sexta-feira 14h").
            </p>
          </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedListId || !slotTime}
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