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

  const user = {
    ...session.user,
    role: session.user.role || "MANAGER"
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-black">
        {/* A Sidebar consome o contexto internamente */}
        <Sidebar userRole={user.role} />
        
        {/* O Wrapper ajusta a margem baseado no contexto */}
        <DashboardWrapper>
          <Header user={user} />
          <div className="flex-1 p-6 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </DashboardWrapper>
      </div>
    </SidebarProvider>
  );
}