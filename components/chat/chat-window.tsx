'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Menu, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import { sendMessageToSilvia, ChatMessage } from '@/app/actions/silvia';
import { toast } from 'sonner';
import Link from 'next/link';

interface ChatWindowProps {
  initialMessages?: ChatMessage[];
  sessionId?: string;
  user?: any;
  sessions?: any[];
}

export function ChatWindow({ 
  initialMessages = [], 
  sessionId: initialSessionId,
  user,
  sessions = []
}: ChatWindowProps) {
  const router = useRouter();
  
  // Estado local
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. CORREÇÃO CRÍTICA DO USEEFFECT
  // Só atualiza o estado vindo de props se o ID da sessão MUDAR.
  // Isso evita que um refresh na rota /chat limpe a conversa recém-criada.
  useEffect(() => {
    if (initialSessionId !== sessionId) {
      setMessages(initialMessages);
      setSessionId(initialSessionId);
    }
  }, [initialSessionId, initialMessages]); // Mantemos as deps, mas a lógica if protege

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 2. Optimistic Update (Atualização visual imediata)
    const tempUserMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    const optimisticHistory = [...messages, tempUserMsg];
    
    setMessages(optimisticHistory);
    setIsLoading(true);

    try {
      // Chama Server Action
      const response = await sendMessageToSilvia(messages, text, sessionId);
      
      if (response.success && response.messages) {
        // Atualiza com a resposta real do servidor (inclui a fala da IA)
        setMessages(response.messages);
        
        // 3. LÓGICA DE NAVEGAÇÃO CORRIGIDA
        // Se não tínhamos ID (era nova conversa) e agora temos:
        if (!sessionId && response.sessionId) {
          const newId = response.sessionId;
          setSessionId(newId); // Atualiza estado local para travar o useEffect
          
          // Navegação Real para a rota dinâmica
          // Isso garante que se der F5, os dados vêm do banco corretamente
          router.push(`/chat/${newId}`); 
          
          // O refresh atualiza a sidebar em background
          router.refresh(); 
        }
      } else {
        toast.error("Erro", { description: response.error });
        // Rollback suave: remove a última mensagem se falhou
        setMessages(prev => prev.filter(m => m !== tempUserMsg));
        setInput(text);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão");
      setMessages(prev => prev.filter(m => m !== tempUserMsg));
      setInput(text);
    } finally {
      setIsLoading(false);
      if (window.innerWidth > 768) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between p-3 border-b md:border-b-0 md:absolute md:top-4 md:right-4 md:z-10 md:bg-transparent">
        
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <ChatSidebar user={user} sessions={sessions} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">Silvia AI</span>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => {
            router.push('/chat');
            // Forçamos reset visual ao clicar em +
            setMessages([]);
            setSessionId(undefined);
          }}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="hidden md:block">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur hover:bg-background">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          {messages.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
              <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                 <Avatar className="h-20 w-20 relative border-4 border-background shadow-xl">
                   <AvatarImage src="/silvia-avatar.png" />
                   <AvatarFallback className="text-2xl font-bold text-primary">SI</AvatarFallback>
                 </Avatar>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">Como posso ajudar?</h2>
              <p className="text-muted-foreground max-w-[400px] mb-8">
                Inicie uma nova conversa perguntando sobre sua agenda ou pacientes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[500px]">
                {["Minha agenda hoje", "Buscar paciente", "Resumo financeiro", "Criar lembrete"].map(s => (
                  <button 
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs p-3 border rounded-lg hover:bg-muted text-left transition-colors text-muted-foreground hover:text-foreground"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* LISTA DE MENSAGENS */
            <div className="flex flex-col pt-4 md:pt-14 pb-4 gap-2">
              {messages.map((msg, idx) => (
                <ChatMessageBubble key={idx} {...msg} />
              ))}
              {isLoading && (
                <div className="w-full flex gap-4 p-4 md:p-6 animate-in fade-in">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 bg-background/80 backdrop-blur-sm border-t md:border-t-0">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-end w-full p-2 border rounded-2xl bg-muted/30 focus-within:bg-background focus-within:ring-2 ring-primary/20 transition-all shadow-sm"
          >
            <Textarea 
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Envie uma mensagem..."
              className="min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 px-3 py-3 custom-scrollbar text-base"
              rows={1}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="mb-1 mr-1 shrink-0 rounded-xl h-10 w-10 transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}