'use server';

import { auth } from '@/auth';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

interface SendMessageResponse {
  success: boolean;
  messages?: ChatMessage[];
  error?: string;
}

export async function sendMessageToSilvia(history: ChatMessage[], newMessage: string): Promise<SendMessageResponse> {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return { success: false, error: "Não autorizado." };
  }

  const N8N_WEBHOOK_URL = process.env.N8N_SILVIA_WEBHOOK_URL; // Ex: https://n8n.seudominio.com/webhook/silvia-chat
  const API_KEY = process.env.N8N_API_KEY; // A chave definida no Header Auth do n8n

  if (!N8N_WEBHOOK_URL) {
    console.error("N8N_SILVIA_WEBHOOK_URL não definida");
    return { success: false, error: "Erro de configuração do servidor." };
  }

  try {
    // Dispara para o n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || '',
      },
      body: JSON.stringify({
        userId: session.user.id, // CRÍTICO: Para filtrar dados no Postgres
        userEmail: session.user.email,
        userName: session.user.name,
        message: newMessage,
        // Opcional: enviar histórico se não usar memória Redis no n8n, 
        // mas como configuramos Redis lá, enviamos apenas a nova.
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro n8n: ${response.statusText}`);
    }

    const data = await response.json();
    
    // O n8n deve retornar: { "text": "Resposta da IA..." } (Padrão do Output Parser do Agent)
    // Ou se você configurou saída personalizada, ajuste aqui.
    const botResponseText = typeof data === 'string' ? data : (data.text || data.output || data.response);

    const botResponse: ChatMessage = {
      role: 'assistant',
      content: botResponseText,
      timestamp: Date.now(),
    };

    return {
      success: true,
      messages: [...history, { role: 'user', content: newMessage, timestamp: Date.now() }, botResponse],
    };

  } catch (error) {
    console.error("Erro ao falar com Silvia (n8n):", error);
    return { success: false, error: "Silvia está dormindo no momento. Tente já já." };
  }
}