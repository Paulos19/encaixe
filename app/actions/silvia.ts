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

    // 3. Preparar Contexto Temporal (CORREÇÃO DE ANO/DATA)
    // Isso impede a "alucinação" de datas antigas (ex: 2024)
    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Injeta o contexto no topo da mensagem
    const messageWithContext = `
[CONTEXTO DE SISTEMA]
Data Atual: ${dataAtual}
Hora Atual: ${horaAtual}
Usuário: ${session.user.name}
--------------------------------
${newMessage}`;

    // 4. Preparar Histórico para o N8N
    // Recuperamos as últimas 10 mensagens do banco para dar memória à Silvia
    const dbHistory = await prisma.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Formata: "Human: ... \n Assistant: ..."
    const formattedHistory = dbHistory.reverse().map(m => 
      `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
    ).join('\n');

    // 5. Chamar n8n (Silvia)
    const N8N_URL = process.env.N8N_SILVIA_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
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
        sessionId: currentSessionId,
        userName: session.user.name,
        userEmail: session.user.email,
        
        // Campos para o AI Agent do N8N:
        chatInput: messageWithContext,  // Mensagem com a data injetada
        chatHistory: formattedHistory,  // Histórico formatado
        message: messageWithContext,    // Fallback caso seu workflow use 'message'
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erro n8n: ${response.status}`);
    }

    // 6. Processar Resposta
    const textResponse = await response.text();
    let botText = "";
    
    try {
      const json = JSON.parse(textResponse);
      // Tenta várias chaves comuns de retorno de IA
      botText = json.output || json.text || json.response || json.message || (typeof json === 'string' ? json : JSON.stringify(json));
    } catch {
      botText = textResponse;
    }

    // Limpeza de aspas extras se houver
    if (typeof botText === 'string' && botText.startsWith('"') && botText.endsWith('"')) {
       try { botText = JSON.parse(botText); } catch {}
    }

    if (!botText || !botText.trim()) botText = "Estou processando, mas fiquei sem resposta. Verifique meu status.";

    // 7. Persistir Resposta da IA
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'assistant',
        content: botText,
      }
    });

    // Atualiza o 'updatedAt' da sessão para ela subir na lista da sidebar
    await prisma.chatSession.update({
      where: { id: currentSessionId },
      data: { updatedAt: new Date() }
    });

    revalidatePath('/chat');
    
    // 8. Retornar Histórico Completo Atualizado do Banco
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
    console.error("[Silvia Action]", error);
    return { success: false, error: "Falha ao processar mensagem. Tente novamente." };
  }
}

// --- Funções Auxiliares de Sessão ---

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

export async function renameChatSession(sessionId: string, newTitle: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Não autorizado' };
  }

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.userId !== session.user.id) {
      return { success: false, error: 'Sessão não encontrada ou acesso negado' };
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: newTitle.substring(0, 50) },
    });

    revalidatePath('/chat');
    return { success: true };
  } catch (error) {
    console.error('Erro ao renomear sessão:', error);
    return { success: false, error: 'Erro ao atualizar título' };
  }
}

export async function deleteChatSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Não autorizado' };
  }

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.userId !== session.user.id) {
      return { success: false, error: 'Sessão não encontrada ou acesso negado' };
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    revalidatePath('/chat');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir sessão:', error);
    return { success: false, error: 'Erro ao excluir conversa' };
  }
}