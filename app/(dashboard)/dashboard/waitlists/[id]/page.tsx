import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes UI
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Phone, Clock, User as UserIcon } from "lucide-react";

// Componentes Customizados
import { AddPatientDialog } from "@/components/waitlist/add-patient-dialog";
import { TriggerSlotDialog } from "@/components/waitlist/trigger-slot-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Mapa de Status para UI (Label e Cor)
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  WAITING: { 
    label: "Aguardando", 
    variant: "secondary",
    className: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
  },
  NOTIFIED: { 
    label: "Notificado", 
    variant: "default", 
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
  },
  CONFIRMED: { 
    label: "Confirmado", 
    variant: "default",
    className: "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
  },
  DECLINED: { 
    label: "Recusou", 
    variant: "destructive" 
  },
  EXPIRED: { 
    label: "Expirou", 
    variant: "outline",
    className: "text-zinc-500"
  },
  CANCELED: { 
    label: "Cancelado", 
    variant: "outline",
    className: "text-zinc-400 decoration-slate-500 line-through"
  },
};

export default async function WaitlistDetailsPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.email) return null;

  // Busca a lista, verificando se pertence ao usuário logado
  const waitlist = await prisma.waitlist.findFirst({
    where: { 
      id: id,
      owner: { email: session.user.email }
    },
    include: {
      entries: {
        include: { patient: true },
        // Ordenação: 
        // 1. Quem foi notificado aparece no topo (para acompanhamento)
        // 2. Depois por ordem de chegada (FIFO)
        orderBy: [
            { status: 'asc' }, // Hack simples: Na ordem alfabética C(onfirmed), D(eclined), N(otified), W(aiting). Ajuste conforme necessidade real.
            { addedAt: 'asc' }
        ] 
      }
    }
  });

  if (!waitlist) return notFound();

  // Filtro visual simples para saber se a lista está "operacional"
  const isListEmpty = waitlist.entries.filter(e => e.status === 'WAITING').length === 0;

  return (
    <div className="space-y-6">
      {/* --- Header da Página --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {waitlist.name}
                </h1>
                <Badge variant={waitlist.isActive ? "default" : "secondary"}>
                    {waitlist.isActive ? "Ativa" : "Pausada"}
                </Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">
                {waitlist.description || "Gerencie a fila de espera e dispare notificações automáticas para seus pacientes."}
            </p>
        </div>
        
        {/* Barra de Ações */}
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
                Configurações
            </Button>
            
            {/* Botão de Disparo (Novo) */}
            <TriggerSlotDialog 
                waitlistId={waitlist.id} 
                disabled={!waitlist.isActive || isListEmpty}
            />
            
            {/* Botão de Adicionar Paciente */}
            <AddPatientDialog waitlistId={waitlist.id} />
        </div>
      </div>

      {/* --- Tabela de Pacientes --- */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entrou em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitlist.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <UserIcon className="h-8 w-8 opacity-20" />
                    <p>Nenhum paciente nesta fila.</p>
                    <p className="text-xs">Clique em "Adicionar Paciente" para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              waitlist.entries.map((entry, index) => {
                const statusInfo = statusConfig[entry.status] || statusConfig.WAITING;
                
                return (
                  <TableRow key={entry.id} className="group">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {entry.patient.name}
                          </span>
                          {entry.patient.notes && (
                              <span className="text-xs text-muted-foreground max-w-[250px] truncate" title={entry.patient.notes}>
                                  {entry.patient.notes}
                              </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Phone className="h-3 w-3" />
                          {entry.patient.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusInfo.variant} 
                        className={statusInfo.className}
                      >
                          {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" title={entry.addedAt.toLocaleString()}>
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(entry.addedAt, { locale: ptBR, addSuffix: true })}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                          <DropdownMenuItem>Editar Observações</DropdownMenuItem>
                          <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            Mover para o Final
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            Remover da Fila
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}