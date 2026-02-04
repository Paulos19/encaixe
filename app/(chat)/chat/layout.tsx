import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="hidden md:flex w-[280px] flex-col border-r h-full bg-muted/10 shrink-0 z-20">
         {/* Passamos as sessões reais aqui */}
         <ChatSidebar user={user} sessions={sessions} />
      </aside>

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {children}
      </main>
    </div>
  );
}