'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Menu, Plus, Sparkles, Paperclip, Eraser, ChevronDown, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import { sendMessageToSilvia, ChatMessage } from '@/app/actions/silvia';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tenta encontrar o título da sessão atual
  const currentSession = sessions?.find(s => s.id === sessionId);
  const chatTitle = currentSession?.title || "Nova Conversa";

  useEffect(() => {
    if (initialSessionId !== sessionId) {
      setMessages(initialMessages);
      setSessionId(initialSessionId);
    }
  }, [initialSessionId, initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, customMessage?: string) => {
    e?.preventDefault();
    const textToSend = customMessage || input;

    if (!textToSend.trim() || isLoading) return;

    if (!customMessage) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }

    if (textToSend.trim() === '/limpar') {
      setMessages([]);
      toast.info("Memória limpa localmente.");
      return;
    }

    const tempUserMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    const optimisticHistory = [...messages, tempUserMsg];
    
    setMessages(optimisticHistory);
    setIsLoading(true);

    try {
      const response = await sendMessageToSilvia(messages, textToSend, sessionId);
      
      if (response.success && response.messages) {
        setMessages(response.messages);
        
        if (!sessionId && response.sessionId) {
          const newId = response.sessionId;
          setSessionId(newId);
          window.history.replaceState(null, '', `/chat/${newId}`);
          router.refresh(); 
        }
      } else {
        toast.error("Erro", { description: response.error });
        setMessages(prev => prev.filter(m => m !== tempUserMsg));
        if (!customMessage) setInput(textToSend);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão");
      setMessages(prev => prev.filter(m => m !== tempUserMsg));
    } finally {
      setIsLoading(false);
      if (window.innerWidth > 768 && !customMessage) {
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
    <div className="flex flex-col h-full bg-background dark:bg-[#09090b] relative font-sans transition-colors duration-300">
      
      {/* --- HEADER GEMINI STYLE --- */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 bg-background/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-border/20">
        
        <div className="flex items-center gap-2">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9 text-muted-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <ChatSidebar user={user} sessions={sessions} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Model Selector (Estilo Gemini) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-10 px-3 gap-2 text-foreground/80 hover:bg-muted/50 rounded-xl group transition-all"
              >
                <span className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">Silvia AI 1.5</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 p-2">
               <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                 Modelos Disponíveis
               </div>
               <DropdownMenuItem className="gap-3 py-2 cursor-pointer bg-muted/50">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Silvia Pro 1.5</span>
                    <span className="text-[10px] text-muted-foreground">Melhor para raciocínio complexo</span>
                  </div>
               </DropdownMenuItem>
               <DropdownMenuItem className="gap-3 py-2 cursor-pointer" disabled>
                  <Bot className="w-4 h-4" />
                  <div className="flex flex-col opacity-50">
                    <span className="font-medium">Silvia Flash (Em breve)</span>
                    <span className="text-[10px] text-muted-foreground">Mais rápida e leve</span>
                  </div>
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Título Centralizado (Opcional, ou ações à direita) */}
        <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2 opacity-60 pointer-events-none">
           <span className="text-xs font-medium truncate max-w-[200px]">{chatTitle}</span>
        </div>

        <div className="flex items-center gap-1">
           {/* Botão Limpar Memória */}
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full"
                  onClick={() => handleSubmit(undefined, '/limpar')}
                  disabled={isLoading}
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Limpar Contexto</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            variant="ghost" size="icon" className="md:hidden rounded-full" 
            onClick={() => { router.push('/chat'); setMessages([]); setSessionId(undefined); }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
        <div className="max-w-3xl mx-auto h-full flex flex-col pt-6 pb-4">
          
          {messages.length === 0 ? (
            /* EMPTY STATE PREMIUM */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
              <div className="bg-background dark:bg-muted/20 p-6 rounded-[2rem] shadow-xl dark:shadow-none mb-8 relative group">
                 <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000" />
                 <Avatar className="h-20 w-20 relative z-10">
                   <AvatarImage src="/silvia-avatar.png" className="object-cover object-top scale-110" />
                   <AvatarFallback className="text-2xl font-bold text-primary">SI</AvatarFallback>
                 </Avatar>
              </div>
              
              <h2 className="text-3xl font-semibold tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Olá, {user?.name?.split(' ')[0] || 'Doutor(a)'}
              </h2>
              <p className="text-muted-foreground text-lg max-w-[420px] mb-10 leading-relaxed font-light">
                Como posso ajudar a otimizar sua clínica hoje?
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[650px]">
                {[
                  { icon: "📅", text: "Minha agenda hoje", desc: "Verificar horários vagos" },
                  { icon: "👤", text: "Buscar paciente", desc: "Encontrar ficha completa" },
                  { icon: "📝", text: "Criar paciente", desc: "Cadastrar novo perfil" },
                  { icon: "📊", text: "Resumo financeiro", desc: "Ver faturamento do mês" }
                ].map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInput(s.text)}
                    className="flex items-start gap-4 p-4 text-left bg-muted/30 dark:bg-muted/10 border border-transparent hover:border-primary/20 hover:bg-muted/50 rounded-2xl transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.text}</span>
                      <span className="text-xs text-muted-foreground/80">{s.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGES LIST */
            <div className="flex flex-col justify-end min-h-0">
              {messages.map((msg, idx) => (
                <ChatMessageBubble key={idx} {...msg} />
              ))}
              
              {isLoading && (
                <div className="flex w-full justify-start mb-6 animate-pulse px-4">
                   <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 bg-foreground/20 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground/20 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-foreground/20 rounded-full animate-bounce"></span>
                      </div>
                   </div>
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* --- FLOATING INPUT AREA --- */}
      <div className="p-4 pb-6 bg-transparent">
        <div className="max-w-3xl mx-auto relative">
          
          <form 
            onSubmit={(e) => handleSubmit(e)}
            className={cn(
              "relative flex items-end w-full p-2 rounded-[28px] border border-border/50 transition-all shadow-xl shadow-black/5 dark:shadow-black/20",
              "bg-background/80 dark:bg-[#18181b]/90 backdrop-blur-xl focus-within:ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
            )}
          >
            <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground mb-1 ml-1">
               <Plus className="w-5 h-5" />
            </Button>

            <Textarea 
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa a Silvia..."
              className="flex-1 min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 px-3 py-3 custom-scrollbar text-base placeholder:text-muted-foreground/50"
              rows={1}
            />
            
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
              className={cn(
                "mb-1 mr-1 h-10 w-10 rounded-full transition-all duration-300 shadow-sm",
                input.trim() 
                  ? "bg-primary text-primary-foreground scale-100" 
                  : "bg-muted text-muted-foreground scale-90 opacity-0 pointer-events-none"
              )}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
          
          <p className="text-[10px] text-center text-muted-foreground/40 mt-3 select-none font-medium">
            Silvia pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}