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
  Phone, 
  Clock, 
  User as UserIcon, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Settings
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Componentes da Funcionalidade
import { AddPatientDialog } from "@/components/waitlist/add-patient-dialog";
import { TriggerSlotDialog } from "@/components/waitlist/trigger-slot-dialog";
import { ImportPatientsDialog } from "@/components/waitlist/import-patients-dialog";
import { WaitlistEntryActions } from "@/components/waitlist/waitlist-entry-actions"; // <--- Importe Novo

interface PageProps {
  params: Promise<{ id: string }>;
}

// Configuração Visual dos Status
const statusStyles: Record<string, string> = {
  WAITING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  NOTIFIED: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
  CONFIRMED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  DECLINED: "bg-red-500/10 text-red-500 border-red-500/20",
  EXPIRED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 line-through",
  CANCELED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const statusLabels: Record<string, string> = {
  WAITING: "Aguardando",
  NOTIFIED: "Notificado",
  CONFIRMED: "Confirmado",
  DECLINED: "Recusou",
  EXPIRED: "Expirou",
  CANCELED: "Cancelado",
};

export default async function WaitlistDetailsPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.email) return null;

  const waitlist = await prisma.waitlist.findFirst({
    where: { 
      id: id,
      owner: { email: session.user.email }
    },
    include: {
      entries: {
        include: { patient: true },
        orderBy: [
            { status: 'asc' }, 
            { addedAt: 'asc' }
        ] 
      }
    }
  });

  if (!waitlist) return notFound();

  // Cálculo de Métricas Rápidas
  const waitingCount = waitlist.entries.filter(e => e.status === 'WAITING').length;
  const notifiedCount = waitlist.entries.filter(e => e.status === 'NOTIFIED').length;
  const confirmedToday = waitlist.entries.filter(e => e.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {waitlist.name}
                </h1>
                <Badge variant="outline" className={waitlist.isActive ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" : "border-zinc-500 text-zinc-500"}>
                    {waitlist.isActive ? "Ativa" : "Pausada"}
                </Badge>
            </div>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">
                {waitlist.description || "Gerencie o fluxo de pacientes desta lista."}
            </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Settings className="h-4 w-4 mr-2 sm:hidden" />
                <span className="hidden sm:inline">Configurações</span>
                <span className="sm:hidden">Config</span>
            </Button>
            
            <div className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 min-w-fit">
                <ImportPatientsDialog waitlistId={waitlist.id} />
                <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
                <AddPatientDialog waitlistId={waitlist.id} />
            </div>

            <div className="w-full sm:w-auto">
              <TriggerSlotDialog 
                  waitlistId={waitlist.id} 
                  disabled={!waitlist.isActive || waitingCount === 0}
              />
            </div>
        </div>
      </div>

      {/* --- QUICK STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0"><Clock className="h-5 w-5" /></div>
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase font-bold truncate">Fila de Espera</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">{waitingCount}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0"><AlertCircle className="h-5 w-5" /></div>
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase font-bold truncate">Notificados</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">{notifiedCount}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase font-bold truncate">Confirmados</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">{confirmedToday}</p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* --- TABLE --- */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] text-center font-bold text-xs uppercase tracking-wider text-zinc-500">#</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">Paciente</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">Contato</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">Convênio</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">Tempo na Fila</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-zinc-500">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlist.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-3">
                      <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 opacity-50" />
                      </div>
                      <p className="text-sm">Nenhum paciente nesta fila.</p>
                      <p className="text-xs opacity-70">Use os botões acima para adicionar pacientes.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                waitlist.entries.map((entry, index) => {
                  const statusClass = statusStyles[entry.status] || statusStyles.WAITING;
                  const statusLabel = statusLabels[entry.status] || entry.status;
                  
                  return (
                    <TableRow key={entry.id} className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                      <TableCell className="text-center font-medium text-zinc-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {entry.patient.name}
                            </span>
                            {entry.patient.notes && (
                                <span className="text-[11px] text-zinc-500 max-w-[200px] truncate" title={entry.patient.notes}>
                                    {entry.patient.notes}
                                </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                            <Phone className="h-3 w-3 opacity-50" />
                            {entry.patient.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                          {entry.patient.insurance ? (
                              <Badge variant="secondary" className="text-[10px] font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                  {entry.patient.insurance}
                              </Badge>
                          ) : (
                              <span className="text-[10px] text-zinc-400">-</span>
                          )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`text-[10px] uppercase font-bold border ${statusClass}`}
                        >
                            {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500" title={entry.addedAt.toLocaleString()}>
                              <Calendar className="h-3 w-3 opacity-50" />
                              {formatDistanceToNow(entry.addedAt, { locale: ptBR, addSuffix: true })}
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
                        
                        {/* --- AQUI ENTRA O NOVO COMPONENTE DE AÇÕES --- */}
                        <WaitlistEntryActions 
                          entryId={entry.id} 
                          currentStatus={entry.status}
                          waitlistId={waitlist.id} 
                        />

                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}