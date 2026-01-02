'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Zap, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { triggerSlot } from '@/app/actions/notification';
import { cn } from '@/lib/utils';
import { GradientText } from '@/components/ui/gradient-text';
import { Button } from '@/components/ui/button'; // Fallback para footer

interface TriggerDialogProps {
  waitlistId: string;
  disabled?: boolean;
}

export function TriggerSlotDialog({ waitlistId, disabled }: TriggerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('waitlistId', waitlistId);

    const result = await triggerSlot(formData);
    
    setLoading(false);
    
    if (result?.error) {
      alert(result.error); // TODO: Use Toast
    } else if (result?.success) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* --- O NOVO BOTÃO DE DETONAÇÃO --- */}
        <motion.button
          disabled={disabled}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={cn(
            "relative group flex items-center gap-3 px-6 py-2.5 rounded-full font-bold text-white shadow-xl transition-all duration-300",
            disabled 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700" 
              : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.6)] border border-amber-400/20"
          )}
        >
          {/* Background Animado (Shimmer) */}
          {!disabled && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </div>
          )}

          {/* Glow Pulsante Atrás */}
          {!disabled && (
            <span className="absolute -inset-1 rounded-full bg-amber-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}

          {/* Ícone e Texto */}
          <div className="relative z-10 flex items-center gap-2">
            <div className={cn("p-1 rounded-full bg-white/10 backdrop-blur-sm", !disabled && "text-amber-100")}>
                <Zap className={cn("h-4 w-4", isHovered && !disabled && "fill-current animate-pulse")} />
            </div>
            <span className="tracking-wide text-sm">
              DISPARAR VAGA
            </span>
          </div>

          {/* Badge 'Live' se estiver ativo */}
          {!disabled && (
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-amber-600"></span>
             </span>
          )}
        </motion.button>
      </DialogTrigger>

      {/* --- O MODAL (Conteúdo) --- */}
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
              <Label htmlFor="slotTime" className="text-zinc-300 font-medium">
                Qual horário vagou?
              </Label>
              <div className="relative group">
                <Input
                  id="slotTime"
                  name="slotTime"
                  placeholder="Ex: Amanhã às 14:30"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 pl-4 h-12 text-lg transition-all"
                  autoFocus
                  required
                />
                <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-transparent group-hover:ring-white/10 pointer-events-none" />
              </div>
              <p className="text-[11px] text-amber-500/80 flex items-center gap-1.5 bg-amber-500/5 p-2 rounded-md border border-amber-500/10">
                <Zap className="h-3 w-3" />
                Essa informação será enviada instantaneamente para o paciente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold h-11 shadow-lg shadow-amber-900/20"
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