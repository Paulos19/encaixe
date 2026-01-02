'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsProps {
  stats: {
    totalPatients: number;
    confirmed: number;
    declined: number;
    waiting: number;
  }
}

export function StatsCards({ stats }: StatsProps) {
  // Calculando taxa de conversão simples
  const totalCompleted = stats.confirmed + stats.declined;
  const conversionRate = totalCompleted > 0 
    ? Math.round((stats.confirmed / totalCompleted) * 100) 
    : 0;

  const items = [
    {
      title: "Pacientes na Base",
      value: stats.totalPatients,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "+12% este mês"
    },
    {
      title: "Encaixes Confirmados",
      value: stats.confirmed,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: `${conversionRate}% de conversão`
    },
    {
      title: "Recusas / Expirados",
      value: stats.declined,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      trend: "Atenção necessária"
    },
    {
      title: "Fila Ativa",
      value: stats.waiting,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: "Em tempo real"
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item, idx) => (
        <motion.div key={idx} variants={itemAnim}>
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <div className={cn("p-2 rounded-full transition-colors group-hover:bg-opacity-20", item.bg, item.color)}>
                    <item.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold tracking-tight">{item.value}</div>
                <p className={cn("text-xs text-muted-foreground flex items-center gap-1", item.title.includes("Confirmados") && "text-emerald-600 dark:text-emerald-400")}>
                  {item.title.includes("Base") && <TrendingUp className="h-3 w-3" />}
                  {item.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}