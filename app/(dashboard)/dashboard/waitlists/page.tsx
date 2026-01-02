import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateWaitlistDialog } from "@/components/waitlist/create-waitlist-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, CalendarDays, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { WaitlistGrid } from "@/components/waitlist/waitlist-grid";

// Para facilitar, vou manter o componente Server Side e usar classes CSS e estrutura para beleza.
// Se quiser animação de entrada complexa, teríamos que extrair um Client Component para a lista.
// Vou fazer a lista ser um Client Component para permitir Framer Motion.


export default async function WaitlistsPage() {
  const session = await auth();
  
  if (!session?.user?.email) return null;

  const waitlists = await prisma.waitlist.findMany({
    where: {
      owner: { email: session.user.email }
    },
    include: {
      _count: {
        select: { 
            entries: { where: { status: 'WAITING' } } 
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      {/* Header com Efeito Glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
            Minhas Listas
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md">
            Gerencie suas filas de espera ativas e monitore a demanda em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <CreateWaitlistDialog />
        </div>
      </div>

      {/* Lista Isolada em Client Component para Animações */}
      <WaitlistGrid waitlists={waitlists} />
    </div>
  );
}