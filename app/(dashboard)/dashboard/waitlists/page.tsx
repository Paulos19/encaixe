import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateWaitlistDialog } from "@/components/waitlist/create-waitlist-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function WaitlistsPage() {
  const session = await auth();
  
  if (!session?.user?.email) return null;

  // Busca listas do usuário logado + contagem de pacientes esperando
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Listas de Espera</h2>
          <p className="text-muted-foreground">Gerencie suas filas e disparos automáticos.</p>
        </div>
        <CreateWaitlistDialog />
      </div>

      {waitlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Nenhuma lista criada</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
            Você ainda não tem listas de espera. Crie uma agora para começar a adicionar pacientes.
          </p>
          <CreateWaitlistDialog />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {waitlists.map((list) => (
            <Card key={list.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{list.name}</CardTitle>
                <CardDescription>{list.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  {list._count.entries}
                  <span className="text-sm font-normal text-muted-foreground">pacientes na fila</span>
                </div>
              </CardContent>
              <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4">
                <Link href={`/dashboard/waitlists/${list.id}`} className="w-full">
                  <Button variant="outline" className="w-full justify-between group">
                    Gerenciar Fila
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}