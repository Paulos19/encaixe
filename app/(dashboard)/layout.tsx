import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Garante tipagem segura e fallback para o role
  const user = {
    ...session.user,
    role: session.user.role || "USER", // Mudei fallback para USER por segurança, ajuste conforme sua regra
  };

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar Fixa à esquerda */}
        <Sidebar userRole={user.role} />

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