'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { createPatient, getInsurancesAction } from '@/app/actions/patient';
import { toast } from 'sonner';

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insurances, setInsurances] = useState<{id: number, name: string}[]>([]);

  // Carrega convênios ao abrir
  useEffect(() => {
    if (open) {
      getInsurancesAction().then(data => setInsurances(data));
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await createPatient(formData);
    
    setLoading(false);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      setOpen(false);
      toast.success("Paciente cadastrado/atualizado com sucesso!");
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            <DialogDescription>
              Adicione um paciente à sua base geral (CRM).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" required placeholder="Ex: Maria Silva" />
            </div>

            {/* Telefone e Nascimento */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input id="phone" name="phone" required placeholder="11999998888" type="tel" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="birthDate">Data Nascimento</Label>
                    <Input id="birthDate" name="birthDate" type="date" />
                </div>
            </div>

            {/* Convênio */}
            <div className="grid gap-2">
                <Label htmlFor="insurance">Convênio</Label>
                <Select name="insurance">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione ou deixe em branco" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PARTICULAR">Particular / Nenhum</SelectItem>
                        {insurances.map(ins => (
                            <SelectItem key={ins.id} value={ins.name}>{ins.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Obs */}
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