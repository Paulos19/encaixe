'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatMessageBubble({ role, content, timestamp }: ChatMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex w-full gap-3 md:gap-4 p-4 md:p-6 transition-colors",
      isUser ? "bg-muted/20" : "bg-background"
    )}>
      {/* Avatar */}
      <div className="shrink-0 flex flex-col relative items-end">
        <Avatar className={cn(
          "h-8 w-8 md:h-9 md:w-9 border",
          isUser ? "border-muted-foreground/20" : "border-primary/20 bg-primary/5"
        )}>
          {isUser ? (
            <>
              <AvatarImage src="" /> {/* TODO: User image */}
              <AvatarFallback><User className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/silvia-avatar.png" />
              <AvatarFallback className="text-primary"><Sparkles className="h-4 w-4" /></AvatarFallback>
            </>
          )}
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-semibold text-sm flex items-center gap-2">
          {isUser ? "Você" : "Silvia AI"}
          <span className="text-[10px] text-muted-foreground font-normal">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-sm md:text-base">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Customização fina dos elementos markdown
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              li: ({children}) => <li className="mb-0.5">{children}</li>,
              strong: ({children}) => <span className="font-bold text-primary">{children}</span>,
              a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{children}</a>,
              code: ({className, children}) => {
                const isInline = !className;
                return isInline 
                  ? <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{children}</code>
                  : <div className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2"><code className="font-mono text-xs">{children}</code></div>
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}