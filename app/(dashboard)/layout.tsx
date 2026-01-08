import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Verificação de Sessão
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 2. Busca de Dados de Uso (Server Side)
  // Essencial para preencher a Sidebar e o Header sem chamadas extras de API
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      plan: true,
      messagesSent: true,
      messageLimit: true,
      role: true, // Importante para renderizar itens de Admin na sidebar
      stripeCurrentPeriodEnd: true,
      isTrial: true, // Importante para lógica de trial
    }
  });

  if (!dbUser) {
    redirect("/login");
  }

  // 3. Verificação de Expiração de Trial (Lazy Check)
  // Se o trial venceu, fazemos downgrade silencioso antes de renderizar
  if (dbUser.plan !== 'FREE' && dbUser.stripeCurrentPeriodEnd) {
    const isExpired = new Date(dbUser.stripeCurrentPeriodEnd) < new Date();

    if (isExpired) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          plan: 'FREE',
          isTrial: false,
          messageLimit: 10, // Reseta para cota Free
        }
      });
      // Atualiza objeto local para refletir na UI instantaneamente
      dbUser.plan = 'FREE';
      dbUser.messageLimit = 10;
      dbUser.isTrial = false;
    }
  }

  // 4. Prepara objeto de dados para a Sidebar
  const usageData = {
    plan: dbUser.plan,
    used: dbUser.messagesSent,
    limit: dbUser.messageLimit,
  };

  // Garante tipagem segura da role para o componente
  const user = {
    ...session.user,
    role: dbUser.role || "MANAGER",
    plan: dbUser.plan,
  };

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar recebe role E dados de uso */}
        <Sidebar userRole={user.role} usageData={usageData} />

        {/* Wrapper principal do conteúdo */}
        <DashboardWrapper>
          <Header user={user} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            {/* Animação suave de entrada para todas as páginas */}
            <div className="mx-auto w-full max-w-7xl animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </DashboardWrapper>
      </div>
    </SidebarProvider>
  );
}