import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GradientText } from "@/components/ui/gradient-text";
import { PremiumCard } from "@/components/ui/premium-card";
import { PatientList } from "@/components/patients/patient-list";
import { Button } from "@/components/ui/button";
import { Plus, Users, TrendingUp, UserPlus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // --- Data Fetching ---
  const patients = await prisma.patient.findMany({
    where: { manager: { email: session.user.email } },
    orderBy: { createdAt: 'desc' },
    include: {
        _count: {
            select: { waitlistEntries: true }
        }
    }
  });

  // Métricas Simples
  const totalPatients = patients.length;
  // Exemplo: Novos nos últimos 30 dias (mockado para exemplo visual, ou calcular via JS)
  const newThisMonth = patients.filter(p => {
      const date = new Date(p.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8 pb-8 relative z-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                <GradientText size="4xl">Base de Pacientes</GradientText>
            </div>
            <p className="text-zinc-400 max-w-2xl text-lg">
                Gerencie seus contatos, visualize históricos e engajamento em filas de espera.
            </p>
        </div>
        
        <Button className="h-12 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-900/20 group transition-all hover:scale-105">
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
            Novo Paciente
        </Button>
      </div>

      {/* --- METRICS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard className="p-6 flex items-center gap-4" glow>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Users className="h-7 w-7" />
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total de Pacientes</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{totalPatients}</span>
                    <span className="text-xs text-emerald-500 font-medium flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" /> Ativos
                    </span>
                </div>
            </div>
        </PremiumCard>

        <PremiumCard className="p-6 flex items-center gap-4" delay={0.1}>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <UserPlus className="h-7 w-7" />
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Novos este Mês</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{newThisMonth}</span>
                    <span className="text-xs text-zinc-500">cadastros recentes</span>
                </div>
            </div>
        </PremiumCard>
        
        {/* Card Decorativo / Call to Action */}
        <PremiumCard className="p-0 relative overflow-hidden group cursor-pointer" delay={0.2}>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-purple-600/20 group-hover:opacity-100 transition-opacity opacity-50" />
            <div className="relative p-6 flex flex-col justify-center h-full">
                <p className="text-lg font-bold text-white mb-1">Importar Contatos?</p>
                <p className="text-sm text-zinc-400 mb-3">Traga sua base via CSV ou Excel.</p>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Iniciar Importação →
                </span>
            </div>
        </PremiumCard>
      </div>

      {/* --- MAIN CONTENT --- */}
      <PatientList patients={patients} />
      
    </div>
  );
}