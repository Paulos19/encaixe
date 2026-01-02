import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PatientList } from "@/components/patients/patient-list";
import { CreatePatientDialog } from "@/components/patients/create-patient-dialog"; // <--- Importe aqui
import { Users, TrendingUp, Sparkles, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // --- Data Fetching (Mantém igual) ---
  const patients = await prisma.patient.findMany({
    where: { manager: { email: session.user.email } },
    orderBy: { createdAt: 'desc' },
    include: {
        _count: {
            select: { entries: true }
        }
    }
  });

  // Métricas (Mantém igual)
  const totalPatients = patients.length;
  const now = new Date();
  const newThisMonth = patients.filter(p => {
      const date = new Date(p.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const engagedPatients = patients.filter(p => p._count.entries > 1).length;

  return (
    <div className="space-y-6 md:space-y-8 pb-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex flex-wrap items-center gap-2 md:gap-3">
               Base de Pacientes
               <span className="rounded-full bg-amber-500/10 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  CRM
               </span>
            </h1>
            <p className="text-sm md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Gerencie contatos, visualize históricos e engajamento.
            </p>
        </div>
        
        {/* Substituído o Button pelo Dialog */}
        <CreatePatientDialog />
      </div>

      {/* --- GRID DE MÉTRICAS (Mantenha o código dos cards igual) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ... (Conteúdo dos Cards 1, 2 e 3 permanece o mesmo do original) ... */}
          <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 md:p-6 shadow-sm group hover:border-violet-500/50 transition-colors">
            <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 ring-1 ring-violet-500/20">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Registrado</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{totalPatients}</h3>
                        <span className="text-xs font-medium text-violet-500 flex items-center">
                           <Sparkles className="h-3 w-3 mr-1" /> Ativos
                        </span>
                    </div>
                </div>
            </div>
        </Card>

        {/* CARD 2 */}
        <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 md:p-6 shadow-sm group hover:border-amber-500/50 transition-colors">
            <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-500/20">
                    <UserPlus className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider">Novos (Mês)</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{newThisMonth}</h3>
                        <span className="text-xs font-medium text-amber-500 flex items-center">
                           <TrendingUp className="h-3 w-3 mr-1" /> Crescimento
                        </span>
                    </div>
                </div>
            </div>
        </Card>

        {/* CARD 3 */}
        <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 md:p-6 shadow-sm group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider">Recorrentes</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{engagedPatients}</h3>
                        <span className="text-xs font-medium text-emerald-500 flex items-center">
                           Fidelizados
                        </span>
                    </div>
                </div>
            </div>
        </Card>
      </div>

      {/* --- LISTA INTERATIVA --- */}
      <PatientList patients={patients} />
      
    </div>
  );
}