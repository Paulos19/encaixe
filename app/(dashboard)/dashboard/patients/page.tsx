import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GradientText } from "@/components/ui/gradient-text";
import { PremiumCard } from "@/components/ui/premium-card";
import { PatientList } from "@/components/patients/patient-list";
import { Button } from "@/components/ui/button";
import { Plus, Users, TrendingUp, UserPlus, UploadCloud, Sparkles } from "lucide-react";

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
            select: { entries: true }
        }
    }
  });

  // Métricas
  const totalPatients = patients.length;
  
  const now = new Date();
  const newThisMonth = patients.filter(p => {
      const date = new Date(p.createdAt);
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
                Gerencie seus contatos, visualize históricos e engajamento.
            </p>
        </div>
        
        <Button className="h-12 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-900/20 group transition-all hover:scale-105 active:scale-95">
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
            Novo Paciente
        </Button>
      </div>

      {/* --- METRICS GRID (Novas Cores: Violeta & Ouro) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Total de Pacientes (Tema VIOLETA - Profundidade) */}
        <PremiumCard className="p-6 flex flex-row items-center gap-5" glow>
            {/* Ícone Iluminado */}
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center ring-1 ring-violet-500/50 shadow-[0_0_25px_-5px_rgba(139,92,246,0.4)] backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <Users className="h-8 w-8 text-violet-400" />
            </div>
            <div>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total na Base</p>
                {/* Número Gigante e Branco */}
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{totalPatients}</span>
                </div>
                 <span className="text-xs text-violet-400 font-semibold flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> Base Ativa
                </span>
            </div>
            {/* Background Accent sutil */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-violet-600/10 blur-[50px] rounded-full -z-10" />
        </PremiumCard>

        {/* CARD 2: Novos este Mês (Tema ÂMBAR/GOLD - Alinhado à Marca) */}
        <PremiumCard className="p-6 flex items-center gap-5" delay={0.1}>
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center ring-1 ring-amber-500/50 shadow-[0_0_25px_-5px_rgba(245,158,11,0.4)] backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <UserPlus className="h-8 w-8 text-amber-400" />
            </div>
            <div>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Novos (Mês)</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{newThisMonth}</span>
                </div>
                <span className="text-xs text-amber-400 font-semibold flex items-center mt-1">
                    <Sparkles className="h-3 w-3 mr-1" /> Crescimento
                </span>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-600/10 blur-[50px] rounded-full -z-10" />
        </PremiumCard>
        
        {/* CARD 3: Importar (Tema NEUTRO/PRATA - Ação) */}
        <PremiumCard className="p-0 relative overflow-hidden group cursor-pointer border-zinc-800 hover:border-zinc-600" delay={0.2}>
            {/* Gradiente de fundo escuro para leitura */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
            
            <div className="relative p-6 h-full flex flex-col justify-between z-10">
               <div className="flex justify-between items-start">
                   <div>
                    <p className="text-xl font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
                        Importar Dados
                    </p>
                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        CSV ou Excel
                    </p>
                   </div>
                   <div className="p-3 rounded-xl bg-zinc-800/80 group-hover:bg-amber-500/20 transition-colors border border-white/5">
                    <UploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                   </div>
               </div>
               
               <div className="mt-4">
                   <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-0 group-hover:w-full transition-all duration-700 ease-out" />
                   </div>
                   <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest text-right group-hover:text-amber-500 transition-colors">
                        Clique para iniciar
                   </p>
               </div>
            </div>
        </PremiumCard>
      </div>

      {/* --- LISTA DE PACIENTES --- */}
      <PatientList patients={patients} />
      
    </div>
  );
}