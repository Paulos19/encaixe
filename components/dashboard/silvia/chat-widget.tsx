'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage, sendMessageToSilvia } from '@/app/actions/silvia';
import { toast } from 'sonner';

export function SilviaChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou a Silvia, sua assistente virtual. Como posso ajudar com sua agenda ou pacientes hoje?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    // Otimistic update
    const currentHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Chama a Server Action
      const response = await sendMessageToSilvia(currentHistory, userMsg.content);

      if (response.success && response.messages) {
        // Atualiza com a resposta real do "backend"
        // Nota: Na integração real, talvez a gente receba apenas a nova mensagem do bot
        // para economizar banda, mas por enquanto substituímos o histórico.
        const lastMsg = response.messages[response.messages.length - 1];
        setMessages((prev) => [...prev, lastMsg]); 
      } else {
        toast.error("Erro ao falar com Silvia", { description: response.error });
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="origin-bottom-right"
          >
            <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl border-primary/20 overflow-hidden">
              {/* Header */}
              <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white/20">
                      <AvatarImage src="/silvia-avatar.png" /> {/* TODO: Adicionar asset */}
                      <AvatarFallback className="bg-white/10 text-white">SI</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Silvia AI</h3>
                    <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Online
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Chat Area */}
              <ScrollArea className="flex-1 p-4 bg-muted/30">
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm shadow-sm",
                        msg.role === 'user'
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-background border border-border"
                      )}
                    >
                      {msg.content}
                      <span className={cn(
                        "text-[10px] opacity-50",
                        msg.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs ml-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>SI</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted px-3 py-2 rounded-lg rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Peça para agendar um encaixe..."
                    className="flex-1 focus-visible:ring-primary/20"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isOpen ? "bg-muted-foreground hover:bg-muted-foreground/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </motion.div>
    </div>
  );
}