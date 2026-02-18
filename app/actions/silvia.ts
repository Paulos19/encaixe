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
  sessionId?: string; 
  error?: string;
}

export async function sendMessageToSilvia(
  history: ChatMessage[], 
  newMessage: string,
  sessionId?: string 
): Promise<SendMessageResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Sessão expirada." };
  }

  const userId = session.user.id;
  let currentSessionId = sessionId;

  try {
    // 1. Gestão da Sessão
    if (!currentSessionId) {
      const newSession = await prisma.chatSession.create({
        data: {
          userId,
          title: newMessage.slice(0, 30) + "...", 
        }
      });
      currentSessionId = newSession.id;
    }

    // 2. Persistir Mensagem
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'user',
        content: newMessage,
      }
    });

    // 3. Contexto Temporal
    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const messageWithContext = `
[CONTEXTO DE SISTEMA]
Data Atual: ${dataAtual}
Hora Atual: ${horaAtual}
Usuário: ${session.user.name}
--------------------------------
${newMessage}`;

    // 4. Histórico
    const dbHistory = await prisma.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedHistory = dbHistory.reverse().map(m => 
      `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
    ).join('\n');

    // 5. Chamar n8n
    const N8N_URL = process.env.N8N_SILVIA_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    const API_KEY = process.env.N8N_API_KEY;

    if (!N8N_URL) throw new Error("Configuração do n8n ausente");

    // Timeout aumentado para 30s (Agendamentos externos podem demorar)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || '',
      },
      body: JSON.stringify({
        userId,
        sessionId: currentSessionId,
        userName: session.user.name,
        userEmail: session.user.email,
        chatInput: messageWithContext, 
        chatHistory: formattedHistory,
        message: messageWithContext, 
      }),
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // TRATAMENTO DE ERRO MELHORADO
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro N8N (${response.status}):`, errorText);
      throw new Error(`Silvia indisponível (${response.status}): ${errorText.slice(0, 100)}`);
    }

    // 6. Processar Resposta
    const textResponse = await response.text();
    let botText = "";
    
    try {
      const json = JSON.parse(textResponse);
      botText = json.output || json.text || json.response || json.message || (typeof json === 'string' ? json : JSON.stringify(json));
    } catch {
      botText = textResponse;
    }

    if (typeof botText === 'string' && botText.startsWith('"') && botText.endsWith('"')) {
       try { botText = JSON.parse(botText); } catch {}
    }

    if (!botText || !botText.trim()) botText = "Estou processando, mas fiquei sem resposta. Verifique meu status.";

    // 7. Persistir Resposta
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'assistant',
        content: botText,
      }
    });

    await prisma.chatSession.update({
      where: { id: currentSessionId },
      data: { updatedAt: new Date() }
    });

    revalidatePath('/chat');
    
    const finalMessages = await prisma.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'asc' }
    });

    return {
      success: true,
      sessionId: currentSessionId,
      messages: finalMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt.getTime()
      }))
    };

  } catch (error: any) {
    console.error("[Silvia Action Error]", error);
    
    // Tratamento específico para Timeout
    if (error.name === 'AbortError') {
        return { success: false, error: "A Silvia demorou muito para responder. A integração pode estar lenta." };
    }

    return { success: false, error: error.message || "Falha ao processar mensagem." };
  }
}

// ... (Funções auxiliares mantidas iguais)
export async function getChatHistory(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId, session: { userId: session.user.id } },
    orderBy: { createdAt: 'asc' }
  });
  return messages.map(m => ({ role: m.role as 'user'|'assistant', content: m.content, timestamp: m.createdAt.getTime() }));
}

export async function renameChatSession(sessionId: string, newTitle: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Não autorizado' };
  try {
    const chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!chatSession || chatSession.userId !== session.user.id) return { success: false, error: 'Erro' };
    await prisma.chatSession.update({ where: { id: sessionId }, data: { title: newTitle.substring(0, 50) } });
    revalidatePath('/chat');
    return { success: true };
  } catch { return { success: false, error: 'Erro' }; }
}

export async function deleteChatSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Não autorizado' };
  try {
    const chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!chatSession || chatSession.userId !== session.user.id) return { success: false, error: 'Erro' };
    await prisma.chatSession.delete({ where: { id: sessionId } });
    revalidatePath('/chat');
    return { success: true };
  } catch { return { success: false, error: 'Erro' }; }
}