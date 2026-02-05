'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Check, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export function ChatMessageBubble({ role, content, timestamp }: ChatMessageBubbleProps) {
  const isUser = role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Formatação de hora segura para hidratação
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Intl.DateTimeFormat('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(ts));
  };

  return (
    <div 
      className={cn(
        "flex w-full mb-6 group relative", // Removido animate-in que causava clipping em alguns browsers
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Container Principal com alinhamento flexível e gap seguro */}
      <div className={cn(
        "flex max-w-[90%] md:max-w-[80%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* --- AVATAR (Apenas Assistant) --- */}
        {!isUser && (
          <Avatar className="h-8 w-8 mt-1 border border-border shrink-0 select-none">
            <AvatarImage src="/silvia-avatar.png" className="object-cover object-top scale-110" />
            <AvatarFallback className="bg-primary/10 text-primary"><Sparkles className="w-4 h-4" /></AvatarFallback>
          </Avatar>
        )}

        {/* --- AVATAR USER (Opcional, para simetria visual se desejar) --- */}
        {isUser && (
          <Avatar className="h-8 w-8 mt-1 border border-border shrink-0 select-none hidden sm:flex">
             <AvatarFallback className="bg-muted text-muted-foreground"><User className="w-4 h-4" /></AvatarFallback>
          </Avatar>
        )}

        {/* --- BOLHA DE CONTEÚDO --- */}
        <div className="flex flex-col min-w-0 max-w-full">
            <div className="flex items-end gap-2 mb-1 px-1">
               <span className="text-[10px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none">
                 {isUser ? 'Você' : 'Silvia AI'}
               </span>
            </div>

            <div className={cn(
              "relative px-4 py-3 text-sm md:text-base shadow-sm overflow-hidden", // overflow-hidden aqui segura conteúdo vazado
              "transition-colors duration-200",
              isUser 
                ? "bg-primary text-primary-foreground rounded-[20px] rounded-tr-sm" 
                : "bg-card dark:bg-zinc-900 border border-border/60 text-foreground rounded-[20px] rounded-tl-sm"
            )}>
              
              {/* RENDERIZADOR MARKDOWN OTIMIZADO */}
              <div className={cn(
                "prose prose-sm max-w-none break-words leading-relaxed", // break-words impede scroll horizontal na bolha
                isUser 
                  ? "prose-invert prose-p:text-primary-foreground prose-a:text-white/90" 
                  : "dark:prose-invert prose-headings:font-semibold prose-a:text-blue-500 prose-pre:bg-zinc-950"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Parágrafos: Margem ajustada para evitar corte
                    p: ({children}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                    
                    // Listas: Padding interno para bullets
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    
                    // Links
                    a: ({href, children}) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity">
                        {children}
                      </a>
                    ),

                    // Code Blocks (O grande vilão do scroll)
                    code: ({node, className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;

                      if (isInline) {
                        return (
                          <code className={cn(
                            "px-1.5 py-0.5 rounded font-mono text-[0.9em]",
                            isUser ? "bg-primary-foreground/20 text-inherit" : "bg-muted text-foreground"
                          )} {...props}>
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="relative my-3 rounded-lg overflow-hidden border border-border/50 bg-zinc-950 dark:bg-black/50 w-full group/code">
                          {/* Header do Código */}
                          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/50 border-b border-white/5">
                             <span className="text-[10px] text-zinc-400 font-mono uppercase">{match?.[1] || 'text'}</span>
                          </div>
                          
                          {/* Área de Scroll Horizontal */}
                          <div className="overflow-x-auto custom-scrollbar p-3">
                            <code className="font-mono text-xs md:text-sm text-zinc-300 whitespace-pre block min-w-fit" {...props}>
                              {children}
                            </code>
                          </div>
                        </div>
                      );
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* --- FOOTER DA MENSAGEM (Timestamp + Actions) --- */}
            <div className={cn(
               "flex items-center gap-2 mt-1 px-1",
               isUser ? "justify-end" : "justify-start"
            )}>
               <span className="text-[10px] text-muted-foreground/60 select-none">
                 {timestamp ? formatTime(timestamp) : ''}
               </span>

               {!isUser && (
                 <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" 
                      onClick={copyToClipboard}
                      title="Copiar resposta"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                 </div>
               )}
            </div>
        </div>
      </div>
    </div>
  );
}