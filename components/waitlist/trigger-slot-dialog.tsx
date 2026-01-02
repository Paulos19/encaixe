'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Zap, Loader2 } from 'lucide-react';
import { triggerSlot } from '@/app/actions/notification';

interface TriggerDialogProps {
  waitlistId: string;
  disabled?: boolean;
}

export function TriggerSlotDialog({ waitlistId, disabled }: TriggerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('waitlistId', waitlistId);

    const result = await triggerSlot(formData);
    
    setLoading(false);
    
    if (result?.error) {
      alert(result.error); // Idealmente use toast aqui
    } else if (result?.success) {
      alert(result.message); // Idealmente use toast aqui
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md shadow-blue-500/20"
          disabled={disabled}
        >
          <Zap className="h-4 w-4 fill-current" />
          Disparar Vaga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Encontrar Paciente</DialogTitle>
            <DialogDescription>
              O sistema buscará automaticamente o próximo paciente da fila e enviará uma oferta via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slotTime" className="text-left font-medium">
                Qual horário vagou?
              </Label>
              <Input
                id="slotTime"
                name="slotTime"
                placeholder="Ex: Amanhã às 14:30"
                className="col-span-3"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Essa informação aparecerá na mensagem enviada.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Disparar Oferta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}