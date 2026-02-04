'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Maximize2 } from 'lucide-react'; // Maximize icon
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage, sendMessageToSilvia } from '@/app/actions/silvia';
import { toast } from 'sonner';
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble'; // IMPORTANTE
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SilviaChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Se já estivermos na página de chat, não mostra o widget
  if (pathname.startsWith('/chat')) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Como posso ajudar com a clínica hoje?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll corrigido para ScrollArea do Shadcn
  useEffect(() => {
    if (scrollViewportRef.current) {
      const scrollElement = scrollViewportRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue.trim();
    const tempUserMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessageToSilvia([...messages, tempUserMsg], text);
      if (response.success && response.messages) {
        setMessages(response.messages);
      } else {
        toast.error("Erro", { description: response.error });
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="origin-bottom-right"
          >
            <Card className="w-[380px] h-[600px] flex flex-col shadow-2xl border-primary/20 overflow-hidden flex flex-col">
              {/* Header Reformulado */}
              <div className="bg-primary px-4 py-3 flex items-center justify-between text-primary-foreground shadow-md z-10">
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
                  <Link href="/chat">
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

              {/* Chat Area com ScrollArea do Shadcn */}
              <ScrollArea className="flex-1 bg-muted/10 p-0" ref={scrollViewportRef}>
                <div className="flex flex-col py-4">
                   {messages.map((msg, idx) => (
                      // Reusando o componente inteligente, mas com padding menor pro widget
                      <div key={idx} className="px-2">
                        <ChatMessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                      </div>
                   ))}
                   {isLoading && (
                     <div className="px-6 py-4 text-xs text-muted-foreground animate-pulse">
                       Silvia está pensando...
                     </div>
                   )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t bg-background">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2 items-end bg-muted/50 p-1.5 rounded-3xl border focus-within:ring-2 ring-primary/10 transition-all"
                >
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Pergunte algo..."
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-4 shadow-none h-10"
                    disabled={isLoading}
                    autoFocus
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
        )}
      </AnimatePresence>

      {/* Botão Flutuante (Manteve o design) */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50",
            isOpen ? "bg-muted-foreground rotate-90" : "bg-primary"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </motion.div>
    </div>
  );
}