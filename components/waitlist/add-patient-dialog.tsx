'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { addPatientToWaitlist, getInsurancesAction } from '@/app/actions/patient';
import { toast } from 'sonner';

export function AddPatientDialog({ waitlistId }: { waitlistId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insurances, setInsurances] = useState<{id: number, name: string}[]>([]);

  // Carrega convênios da API quando o modal abre
  useEffect(() => {
    if (open) {
        getInsurancesAction()
          .then(data => setInsurances(data))
          .catch(() => toast.error("Não foi possível carregar os convênios."));
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('waitlistId', waitlistId);

    const result = await addPatientToWaitlist(formData);
    setLoading(false);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Paciente adicionado com sucesso!");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800">
          <UserPlus className="mr-2 h-4 w-4" /> Adicionar Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Paciente na Fila</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Linha 1: Nome */}
            <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" required placeholder="Ex: Maria Silva" />
            </div>

            {/* Linha 2: Telefone e Nascimento */}
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

            {/* Linha 3: Convênio */}
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

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Ex: Prefere horários à tarde..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar à Fila
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}