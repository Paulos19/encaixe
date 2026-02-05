'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollViewportRef.current) {
      const scrollElement = scrollViewportRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isOpen, isLoading]);

  // Auto-focus quando abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      // Mantém o foco após envio
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 1. OVERLAY (BACKDROP) */}
            {/* Z-Index 60 para ficar ACIMA da Sidebar (z-50) e do Header (z-30) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[60]"
            />

            {/* 2. WIDGET CONTAINER */}
            {/* Z-Index 70 para ficar acima do Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-6 right-6 z-[70] origin-bottom-right"
            >
              <Card className={cn(
                "flex flex-col shadow-2xl border-primary/20 overflow-hidden bg-background",
                // 3. AJUSTE DE ALTURA
                // h-[550px] é menor que o anterior. max-h-[85vh] garante que cabe em telas menores.
                "w-[380px] h-[550px] max-h-[85vh]"
              )}>
                {/* Header */}
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

                {/* Chat Area */}
                <ScrollArea className="flex-1 bg-muted/10 p-0" ref={scrollViewportRef}>
                  <div className="flex flex-col py-4 px-2">
                     {messages.map((msg, idx) => (
                        <ChatMessageBubble key={idx} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                     ))}
                     {isLoading && (
                       <div className="px-6 py-4 text-xs text-muted-foreground animate-pulse flex items-center gap-2">
                         <Sparkles className="w-3 h-3 text-primary" /> Silvia está digitando...
                       </div>
                     )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 border-t bg-background shrink-0">
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

      {/* Botão Flutuante (Sempre visível se fechado) */}
      {/* Z-Index 50 para ficar no nível da Sidebar, mas abaixo do Overlay quando aberto */}
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