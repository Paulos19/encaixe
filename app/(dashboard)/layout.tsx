import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Proteção dupla: middleware já deve pegar, mas aqui garantimos o objeto user
  if (!session?.user) {
    redirect("/login");
  }

  // Garantir que a role existe (fallback seguro)
  const user = {
    ...session.user,
    role: session.user.role || "MANAGER"
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar Desktop - Hidden on Mobile */}
      <div className="hidden border-r bg-zinc-50/40 dark:bg-zinc-900/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <Sidebar userRole={user.role} />
        </div>
      </div>
      
      {/* Área Principal */}
      <div className="flex flex-col">
        <Header user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-zinc-50/20 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}