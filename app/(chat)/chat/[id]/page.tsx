import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';

interface ChatPageProps {
  params: Promise<{ id: string }>; // Next.js 15: params são Promise
}

export default async function ChatSessionPage({ params }: ChatPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect('/login');
  }

  // 1. Busca a Sessão e verifica propriedade (Segurança)
  const chatSession = await prisma.chatSession.findUnique({
    where: { 
      id,
      userId: session.user.id // Garante que só o dono acessa
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!chatSession) {
    notFound(); // Retorna 404 se não existir ou não for do usuário
  }

  // 2. Serializa os dados para o Client Component
  // O Prisma retorna objetos Date, que precisam virar number/string para passar do Server pro Client
  const formattedMessages = chatSession.messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: msg.createdAt.getTime()
  }));

  return (
    <ChatWindow 
      initialMessages={formattedMessages} 
      sessionId={chatSession.id} 
    />
  );
}