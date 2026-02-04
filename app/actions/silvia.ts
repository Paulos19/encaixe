'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

interface SendMessageResponse {
  success: boolean;
  messages?: ChatMessage[];
  sessionId?: string; // Retornamos o ID para redirecionar se for nova
  error?: string;
}

export async function sendMessageToSilvia(
  history: ChatMessage[], 
  newMessage: string,
  sessionId?: string // Opcional: Se null, cria nova conversa
): Promise<SendMessageResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Sessão expirada." };
  }

  const userId = session.user.id;
  let currentSessionId = sessionId;

  try {
    // 1. Gestão da Sessão (Criar ou Usar Existente)
    if (!currentSessionId) {
      const newSession = await prisma.chatSession.create({
        data: {
          userId,
          title: newMessage.slice(0, 30) + "...", // Título temporário
        }
      });
      currentSessionId = newSession.id;
    }

    // 2. Persistir Mensagem do Usuário
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'user',
        content: newMessage,
      }
    });

    // 3. Chamar n8n (Silvia)
    const N8N_URL = process.env.N8N_SILVIA_WEBHOOK_URL;
    const API_KEY = process.env.N8N_API_KEY;

    if (!N8N_URL) throw new Error("Configuração do n8n ausente");

    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || '',
      },
      body: JSON.stringify({
        userId,
        sessionId: currentSessionId, // Importante para o n8n saber o contexto
        message: newMessage,
        userEmail: session.user.email,
        userName: session.user.name,
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erro n8n: ${response.status}`);
    }

    // 4. Processar Resposta
    const textResponse = await response.text();
    let botText = "";
    
    try {
      const json = JSON.parse(textResponse);
      botText = json.output || json.text || json.response || json.message || textResponse;
    } catch {
      botText = textResponse;
    }

    if (!botText.trim()) botText = "Estou processando, mas fiquei sem resposta. Verifique meu status.";

    // 5. Persistir Resposta da IA
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'assistant',
        content: botText,
      }
    });

    // Atualiza o 'updatedAt' da sessão para ela subir na lista
    await prisma.chatSession.update({
      where: { id: currentSessionId },
      data: { updatedAt: new Date() }
    });

    revalidatePath('/chat'); // Atualiza a sidebar
    
    // 6. Retornar Histórico Atualizado do Banco
    // Buscamos tudo do banco para garantir sincronia perfeita
    const dbMessages = await prisma.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'asc' }
    });

    return {
      success: true,
      sessionId: currentSessionId,
      messages: dbMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt.getTime()
      }))
    };

  } catch (error: any) {
    console.error("[Silvia Action]", error);
    return { success: false, error: "Falha ao processar mensagem." };
  }
}

// Action extra para carregar histórico ao abrir a página
export async function getChatHistory(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const messages = await prisma.chatMessage.findMany({
    where: { 
      sessionId,
      session: { userId: session.user.id } // Segurança: Só vê se for dono
    },
    orderBy: { createdAt: 'asc' }
  });

  return messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: m.createdAt.getTime()
  }));
}