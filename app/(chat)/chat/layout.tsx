import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarProvider } from "@/components/ui/sidebar-context"; // Importação Essencial

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // 1. Buscar Sessões do Usuário
  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true }
  });

  // 2. Buscar dados do Usuário
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, image: true, plan: true }
  });

  return (
    // O SidebarProvider DEVE envolver todo o layout para que o contexto funcione
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
        
        {/* A Sidebar agora é autocontida e consome o contexto internamente */}
        <ChatSidebar user={user} sessions={sessions} />

        {/* Área Principal */}
        <main className="flex-1 flex flex-col h-full relative min-w-0 bg-background transition-all duration-300">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}