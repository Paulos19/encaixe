"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, RefreshCw } from "lucide-react";
import { updateEntryStatus } from "@/app/actions/waitlist";
import { toast } from "sonner";

interface WaitlistEntryActionsProps {
  entryId: string;
  currentStatus: string;
  waitlistId: string;
}

const statuses = [
  { label: "Aguardando", value: "WAITING" },
  { label: "Notificado", value: "NOTIFIED" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Recusado", value: "DECLINED" },
  { label: "Expirado", value: "EXPIRED" },
  { label: "Cancelado", value: "CANCELED" },
];

export function WaitlistEntryActions({ entryId, currentStatus, waitlistId }: WaitlistEntryActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (loading || newStatus === currentStatus) return;
    
    setLoading(true);
    const result = await updateEntryStatus(entryId, newStatus, waitlistId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Status alterado para ${newStatus}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <span className="sr-only">Abrir menu</span>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Gerenciar Paciente</DropdownMenuLabel>
        <DropdownMenuItem disabled>Editar Observações</DropdownMenuItem>
        <DropdownMenuItem disabled>Ver Histórico</DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* --- SUBMENU DE STATUS (DEV) --- */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <RefreshCw className="h-4 w-4 text-zinc-500" />
            Alterar Status (Dev)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={currentStatus} onValueChange={handleStatusChange}>
              {statuses.map((status) => (
                <DropdownMenuRadioItem key={status.value} value={status.value}>
                  {status.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* ------------------------------- */}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          Mover para o Final
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
          Remover da Fila
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}