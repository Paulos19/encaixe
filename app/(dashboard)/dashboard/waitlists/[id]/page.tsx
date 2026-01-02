import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AddPatientDialog } from "@/components/waitlist/add-patient-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageProps {
  params: Promise<{ id: string }>; // Next 15 trata params como Promise em server components
}

// Mapa de Cores para Status
const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  WAITING: "secondary",    // Cinza/Azul
  NOTIFIED: "warning",     // Amarelo
  CONFIRMED: "success",    // Verde (precisará criar classe custom ou usar default)
  DECLINED: "destructive", // Vermelho
  EXPIRED: "outline",
  CANCELED: "outline",
};

const statusLabel: Record<string, string> = {
  WAITING: "Aguardando",
  NOTIFIED: "Notificado",
  CONFIRMED: "Confirmado",
  DECLINED: "Recusou",
  EXPIRED: "Expirou",
  CANCELED: "Cancelado",
};

export default async function WaitlistDetailsPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params; // Await params no Next 15

  if (!session?.user?.email) return null;

  // Busca lista e entradas
  const waitlist = await prisma.waitlist.findFirst({
    where: { 
      id: id,
      owner: { email: session.user.email }
    },
    include: {
      entries: {
        include: { patient: true },
        orderBy: { addedAt: 'asc' } // FIFO: Quem chegou primeiro aparece em cima
      }
    }
  });

  if (!waitlist) return notFound();

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{waitlist.name}</h1>
                <Badge variant={waitlist.isActive ? "default" : "destructive"}>
                    {waitlist.isActive ? "Ativa" : "Pausada"}
                </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
                {waitlist.description || "Gerencie os pacientes desta fila."}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">Configurações</Button>
            <AddPatientDialog waitlistId={waitlist.id} />
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tempo na Fila</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitlist.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum paciente nesta fila. Adicione o primeiro!
                </TableCell>
              </TableRow>
            ) : (
              waitlist.entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{entry.patient.name}</span>
                        {entry.patient.notes && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {entry.patient.notes}
                            </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {entry.patient.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[entry.status] as any}>
                        {statusLabel[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(entry.addedAt, { locale: ptBR, addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>Editar Observações</DropdownMenuItem>
                        <DropdownMenuItem>Mover para o Final</DropdownMenuItem>
                        <DropdownMenuLabel>Manual</DropdownMenuLabel>
                        <DropdownMenuItem>Marcar como Confirmado</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Remover da Fila</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}