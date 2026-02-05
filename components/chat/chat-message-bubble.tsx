'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, ThumbsUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatMessageBubble({ role, content, timestamp }: ChatMessageBubbleProps) {
  const isUser = role === 'user';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  return (
    <div className={cn(
      "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* AVATAR SILVIA */}
        {!isUser && (
          <div className="shrink-0 flex flex-col justify-start pt-1">
             <Avatar className="h-8 w-8 ring-1 ring-border bg-background">
               <AvatarImage src="/silvia-avatar.png" className="object-cover object-top scale-110" />
               <AvatarFallback><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback>
             </Avatar>
          </div>
        )}

        {/* BOLHA */}
        <div className={cn(
          "relative group px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-[20px] rounded-tr-md" 
            : "bg-card dark:bg-[#18181b] border border-border/50 text-foreground rounded-[20px] rounded-tl-md"
        )}>
          
          {/* Nome (Opcional, removi para ficar mais limpo estilo Gemini) */}
          
          <div className={cn(
            "prose prose-sm max-w-none break-words",
            isUser ? "prose-invert" : "dark:prose-invert prose-headings:font-semibold prose-a:text-blue-500"
          )}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                strong: ({children}) => <span className="font-semibold text-foreground/90">{children}</span>,
                code: ({className, children}) => {
                  const isInline = !className;
                  return isInline 
                    ? <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{children}</code>
                    : <div className="bg-zinc-950 dark:bg-[#000] p-4 rounded-xl overflow-x-auto my-3 border border-white/10"><code className="font-mono text-xs text-zinc-300">{children}</code></div>
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Ações (Hover) */}
          {!isUser && (
            <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pt-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted" onClick={copyToClipboard}>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted">
                <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}