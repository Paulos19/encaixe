'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  name: string;      // Ex: "Seg", "12/05"
  confirmados: number;
  recusados: number;
}

interface ActivityChartProps {
  data: ChartDataPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="col-span-4 lg:col-span-3"
    >
      <Card className="h-full border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>Fluxo de Encaixes (7 Dias)</CardTitle>
          <CardDescription>
            Visualização diária de vagas preenchidas vs perdidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeclined" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={10} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }} 
                  itemStyle={{ fontSize: '12px' }}
                  cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confirmados" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorConfirmed)" 
                  name="Confirmados"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="recusados" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDeclined)" 
                  name="Perdidos"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}