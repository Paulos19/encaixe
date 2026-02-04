import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ChatWindow } from '@/components/chat/chat-window';
import { redirect } from 'next/navigation';

export default async function NewChatPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Buscamos os dados aqui para passar para a Sidebar Mobile (dentro do ChatWindow)
  // O Layout já cuida da Sidebar Desktop, mas o componente Client precisa desses dados para o Mobile.
  
  const [sessions, user] = await Promise.all([
    prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true }
    }),
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, image: true, plan: true }
    })
  ]);

  return (
    <ChatWindow 
      sessions={sessions} 
      user={user}
      // Não passamos sessionId nem initialMessages pois é uma NOVA conversa
    />
  );
}