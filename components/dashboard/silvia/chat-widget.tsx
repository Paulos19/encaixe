'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage, sendMessageToSilvia } from '@/app/actions/silvia';
import { toast } from 'sonner';
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SilviaChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  if (pathname.startsWith('/chat')) return null;

  // Estado para armazenar o ID da sessão atual do Widget
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Como posso ajudar com a clínica hoje?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue.trim();
    const tempUserMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Passamos o sessionId atual (se existir) para a Server Action
      const response = await sendMessageToSilvia([...messages, tempUserMsg], text, sessionId);
      
      if (response.success && response.messages) {
        setMessages(response.messages);
        
        // CORREÇÃO CRÍTICA: Se não tínhamos ID e a resposta trouxe um, salvamos.
        // Isso garante que a próxima mensagem use o MESMO chat.
        if (!sessionId && response.sessionId) {
          setSessionId(response.sessionId);
        }
      } else {
        toast.error("Erro", { description: response.error });
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Link Dinâmico: Se tiver ID, vai para a conversa. Se não, vai para nova.
  const expandLink = sessionId ? `/chat/${sessionId}` : '/chat';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[60]"
            />

            {/* WIDGET */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-6 right-6 z-[70] origin-bottom-right"
            >
              <Card className="flex flex-col shadow-2xl border-primary/20 bg-background overflow-hidden w-[380px] h-[550px] max-h-[85vh]">
                
                {/* HEADER */}
                <div className="bg-primary px-4 py-3 flex items-center justify-between text-primary-foreground shadow-md z-10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-white/20 bg-white">
                        <AvatarImage src="/silvia-avatar.png" />
                        <AvatarFallback className="text-primary font-bold">SI</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary rounded-full animate-pulse"></span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">Silvia AI</h3>
                      <p className="text-[10px] text-primary-foreground/80 font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Assistente Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* LINK CORRIGIDO */}
                    <Link href={expandLink}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" title="Expandir para tela cheia">
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* AREA DE MENSAGENS */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/10 p-0 overscroll-contain custom-scrollbar">
                  <div className="flex flex-col py-4 px-2 min-h-full">
                     {messages.map((msg, idx) => (
                        <ChatMessageBubble key={idx} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                     ))}
                     
                     {isLoading && (
                       <div className="px-6 py-4 text-xs text-muted-foreground animate-pulse flex items-center gap-2">
                         <Sparkles className="w-3 h-3 text-primary" /> Silvia está digitando...
                       </div>
                     )}
                     
                     <div ref={messagesEndRef} className="h-1" />
                  </div>
                </div>

                {/* INPUT AREA */}
                <div className="p-3 border-t bg-background shrink-0 z-20">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2 items-end bg-muted/50 p-1.5 rounded-3xl border focus-within:ring-2 ring-primary/10 transition-all"
                  >
                    <Input 
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Pergunte algo..."
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-4 shadow-none h-10 text-sm"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!inputValue.trim() || isLoading}
                      className="h-10 w-10 rounded-full shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all duration-300"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </motion.div>
    </>
  );
}