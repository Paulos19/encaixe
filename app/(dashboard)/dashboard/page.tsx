import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { subDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes Premium
import { GreetingCard } from "@/components/dashboard/widgets/greeting-card";
import { StatsCards } from "@/components/dashboard/widgets/stats-cards";
import { ActivityChart } from "@/components/dashboard/widgets/activity-chart";
import { RecentActivity, ActivityItem } from "@/components/dashboard/widgets/recent-activity";
import { PremiumCard } from "@/components/ui/premium-card";
import { GradientText } from "@/components/ui/gradient-text";

// Configuração Next.js
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const userEmail = session.user.email;
  const userName = session.user.name || "Doutor";

  // --- 1. Data Fetching (Paralelo para alta performance) ---
  const [
    totalWaitlists,
    totalPatients,
    confirmedCount,
    declinedCount,
    waitingCount,
    expiredCount
  ] = await Promise.all([
    prisma.waitlist.count({ 
        where: { owner: { email: userEmail }, isActive: true } 
    }),
    prisma.patient.count({ 
        where: { manager: { email: userEmail } } 
    }),
    prisma.waitlistEntry.count({ 
        where: { waitlist: { owner: { email: userEmail } }, status: 'CONFIRMED' } 
    }),
    prisma.waitlistEntry.count({ 
        where: { waitlist: { owner: { email: userEmail } }, status: 'DECLINED' } 
    }),
    prisma.waitlistEntry.count({ 
        where: { waitlist: { owner: { email: userEmail } }, status: 'WAITING' } 
    }),
    prisma.waitlistEntry.count({ 
        where: { waitlist: { owner: { email: userEmail } }, status: 'EXPIRED' } 
    }),
  ]);

  const statsData = {
    totalPatients,
    confirmed: confirmedCount,
    declined: declinedCount + expiredCount, 
    waiting: waitingCount
  };

  // --- 2. Dados do Gráfico (Últimos 7 dias) ---
  const today = new Date();
  const sevenDaysAgo = subDays(today, 6);

  const rawChartData = await prisma.waitlistEntry.findMany({
    where: {
      waitlist: { owner: { email: userEmail } },
      updatedAt: { gte: startOfDay(sevenDaysAgo) },
      status: { in: ['CONFIRMED', 'DECLINED', 'EXPIRED'] }
    },
    select: {
      updatedAt: true,
      status: true
    }
  });

  // Processamento do Gráfico
  const chartMap = new Map<string, { confirmados: number; recusados: number }>();
  
  for (let i = 0; i < 7; i++) {
    const date = subDays(today, 6 - i);
    const label = format(date, 'EEE', { locale: ptBR }).replace('.', ''); 
    chartMap.set(label, { confirmados: 0, recusados: 0 });
  }

  rawChartData.forEach(entry => {
    const label = format(entry.updatedAt, 'EEE', { locale: ptBR }).replace('.', '');
    const current = chartMap.get(label);
    
    if (current) {
        if (entry.status === 'CONFIRMED') {
            current.confirmados += 1;
        } else {
            current.recusados += 1;
        }
    }
  });

  const chartData = Array.from(chartMap.entries()).map(([name, values]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    ...values
  }));

  // --- 3. Atividade Recente (Feed) ---
  const rawActivities = await prisma.waitlistEntry.findMany({
    where: {
      waitlist: { owner: { email: userEmail } },
    },
    include: {
      patient: true,
      waitlist: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 6
  });

  const activityData: ActivityItem[] = rawActivities.map(item => ({
    id: item.id,
    patientName: item.patient.name,
    listName: item.waitlist.name,
    status: item.status,
    updatedAt: item.updatedAt
  }));

  return (
    <div className="space-y-8 pb-8 relative z-10">
      
      {/* 1. Hero Section (Greeting) */}
      <div className="relative">
        <GreetingCard 
            userName={userName} 
            waitingCount={waitingCount} 
        />
        {/* Efeito Glow Ambiente sob o Hero */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-purple-600/20 rounded-[2rem] blur-3xl -z-10 opacity-50" />
      </div>

      {/* 2. Key Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
            <div className="h-5 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <GradientText size="xl">Visão Geral</GradientText>
        </div>
        <StatsCards stats={statsData} />
      </div>

      {/* 3. Grid Principal */}
      <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-4 h-full">
        
        {/* Gráfico (Envelopado no PremiumCard) */}
        <div className="col-span-4 lg:col-span-3 h-full">
             <PremiumCard className="h-full p-6 flex flex-col" glow>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <GradientText size="2xl">Fluxo de Encaixes</GradientText>
                        <p className="text-muted-foreground text-sm mt-1">
                            Performance e conversão dos últimos 7 dias
                        </p>
                    </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                    <ActivityChart data={chartData} /> 
                </div>
             </PremiumCard>
        </div>

        {/* Feed Lateral (Envelopado no PremiumCard) */}
        <div className="col-span-4 lg:col-span-1 h-full">
            <PremiumCard className="h-full p-0 flex flex-col" delay={0.2}>
                <div className="p-5 border-b border-border bg-sidebar/30 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <GradientText size="lg">Tempo Real</GradientText>
                    </div>
                </div>
                <div className="p-2 flex-1 overflow-hidden">
                    <RecentActivity activities={activityData} />
                </div>
            </PremiumCard>
        </div>
      </div>
    </div>
  );
}