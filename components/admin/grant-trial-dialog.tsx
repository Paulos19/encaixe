"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grantTrialAction } from "@/app/actions/admin";
import { Loader2, Sparkles, Zap } from "lucide-react"; // Adicione Zap
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"; // Adicione esta importação

interface GrantTrialDialogProps {
  userId: string;
  userName: string;
  children: React.ReactNode;
}

export function GrantTrialDialog({ userId, userName, children }: GrantTrialDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append("userId", userId);

    const result = await grantTrialAction(formData);

    if (result.success) {
      toast.success(result.message);
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Conceder Teste Grátis</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina um período de experiência para <strong>{userName}</strong>.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="plan">Plano de Destino</Label>
            <Select name="plan" required defaultValue="PRO">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESSENTIAL">Essencial (100 msgs)</SelectItem>
                <SelectItem value="PRO">Pro (300 msgs)</SelectItem>
                <SelectItem value="PLUS">Plus (800 msgs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="days">Duração (Dias)</Label>
            <div className="flex gap-2">
              <Input 
                id="days" 
                name="days" 
                type="number" 
                min="1" 
                max="365" 
                placeholder="Ex: 14" 
                required 
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => (document.getElementById('days') as HTMLInputElement).value = '7'}>7d</Button>
              <Button type="button" variant="outline" onClick={() => (document.getElementById('days') as HTMLInputElement).value = '14'}>14d</Button>
              <Button type="button" variant="outline" onClick={() => (document.getElementById('days') as HTMLInputElement).value = '30'}>30d</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isLoading && <Sparkles className="mr-2 h-4 w-4" />}
              Aplicar Trial
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- NOVO COMPONENTE WRAPPER ---
// Este componente encapsula a lógica do DropdownMenuItem dentro do cliente.
export function GrantTrialDropdownItem({ userId, userName }: { userId: string, userName: string }) {
  return (
    <GrantTrialDialog userId={userId} userName={userName}>
      {/* O onSelect agora está seguro pois estamos em um arquivo 'use client' */}
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Zap className="mr-2 h-4 w-4" />
        Conceder Trial
      </DropdownMenuItem>
    </GrantTrialDialog>
  );
}