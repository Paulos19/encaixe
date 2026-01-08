import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { prisma } from "@/lib/prisma"; // Importação do Prisma

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verificação robusta de sessão
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 1. Buscamos os dados de uso no banco em tempo real (Server Side)
  // Isso evita ter que fazer fetch na Sidebar (Client Side) e previne layout shift
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      plan: true,
      messagesSent: true,
      messageLimit: true,
      role: true, // Buscamos a role do banco para garantir que é a mais atual
    }
  });

  // Se o usuário não existir no banco por algum motivo bizarro, redireciona
  if (!dbUser) {
    redirect("/login");
  }

  // 2. Preparamos o objeto de dados para a Sidebar
  const usageData = {
    plan: dbUser.plan,
    used: dbUser.messagesSent,
    limit: dbUser.messageLimit,
  };

  // Garante tipagem segura e fallback para o role
  const user = {
    ...session.user,
    role: dbUser.role || "MANAGER", // Prioridade para o role do banco
  };

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar Fixa à esquerda 
          Passamos o usageData calculado no servidor
        */}
        <Sidebar userRole={user.role} usageData={usageData} />

        {/* Wrapper que controla a margem esquerda e a área de conteúdo */}
        <DashboardWrapper>
          <Header user={user} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </DashboardWrapper>
      </div>
    </SidebarProvider>
  );
}