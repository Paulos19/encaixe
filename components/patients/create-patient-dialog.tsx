'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { createPatient } from '@/app/actions/patient';

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await createPatient(formData);
    
    setLoading(false);
    
    if (result?.error) {
      // Use alert ou seu componente de Toast preferido
      alert(result.error);
    } else {
      setOpen(false);
      // Opcional: toast.success("Paciente cadastrado!")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 group transition-all">
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
            Novo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            <DialogDescription>
              Adicione um paciente à sua base geral.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" required placeholder="Ex: Maria Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">WhatsApp (Apenas números)</Label>
              <Input id="phone" name="phone" required placeholder="Ex: 11999998888" type="tel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Ex: Paciente VIP, prefere manhã..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Paciente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}