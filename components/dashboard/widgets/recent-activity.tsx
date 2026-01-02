'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Bell, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  patientName: string;
  listName: string;
  status: string; // CONFIRMED, DECLINED, NOTIFIED, WAITING, EXPIRED
  updatedAt: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

// Mapa de ícones e cores por status
const statusConfig: Record<string, any> = {
  CONFIRMED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", text: "confirmou encaixe" },
  DECLINED:  { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", text: "recusou vaga" },
  EXPIRED:   { icon: XCircle, color: "text-zinc-500", bg: "bg-zinc-500/10", text: "não respondeu" },
  NOTIFIED:  { icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10", text: "foi notificado" },
  WAITING:   { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10", text: "entrou na fila" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="col-span-4 lg:col-span-1 h-full"
    >
      <Card className="h-full border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm flex flex-col">
        <CardHeader>
          <CardTitle>Tempo Real</CardTitle>
          <CardDescription>Últimas interações</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2 max-h-[350px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          <div className="space-y-6">
            {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
            ) : (
                activities.map((item) => {
                const config = statusConfig[item.status] || statusConfig.WAITING;
                const Icon = config.icon;

                return (
                    <div key={item.id} className="flex items-start gap-3 group">
                    <div className={cn("mt-1 p-1.5 rounded-full shrink-0 transition-colors", config.bg, config.color)}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                    
                    <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                        {item.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        {config.text} em <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.listName}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                        {formatDistanceToNow(item.updatedAt, { locale: ptBR, addSuffix: true })}
                        </p>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}