import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true }
  });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, image: true, plan: true }
  });

  return (
    // h-[100dvh] garante altura total real no mobile
    // overflow-hidden no pai impede scroll da página inteira
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[280px] flex-col border-r h-full bg-muted/10 shrink-0 z-20">
         <ChatSidebar user={user} sessions={sessions} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-background">
        {children}
      </main>
    </div>
  );
}