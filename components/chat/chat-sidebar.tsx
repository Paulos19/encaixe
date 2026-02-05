'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  Plus, 
  LayoutDashboard, 
  Settings, 
  MoreHorizontal, 
  Trash2, 
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ChatSession = {
  id: string;
  title: string;
  updatedAt: Date;
};

interface ChatSidebarProps {
  user?: any;
  sessions: ChatSession[];
}

export function ChatSidebar({ user, sessions }: ChatSidebarProps) {
  const pathname = usePathname();

  // Agrupamento por data
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let key = 'Anteriores';
    if (date.toDateString() === today.toDateString()) key = 'Hoje';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Ontem';
    else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) key = '7 Dias';

    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  // Ordem de exibição dos grupos
  const order = ['Hoje', 'Ontem', '7 Dias', 'Anteriores'];

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9] dark:bg-[#18181b] border-r border-border/40 w-full transition-colors duration-300">
      
      {/* Header da Sidebar */}
      <div className="p-4 pb-2">
        <Button 
          className="w-full justify-start gap-3 h-11 bg-white dark:bg-muted/50 border border-border/50 shadow-sm hover:bg-muted/80 text-foreground transition-all rounded-xl group"
          asChild
        >
          <Link href="/chat">
            <div className="bg-primary/10 text-primary p-1 rounded-lg group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-medium">Nova Conversa</span>
          </Link>
        </Button>
      </div>

      {/* Lista de Conversas */}
      <ScrollArea className="flex-1 px-3 custom-scrollbar">
        <div className="flex flex-col gap-6 py-2">
          {order.map((period) => {
            const items = groupedSessions[period];
            if (!items || items.length === 0) return null;

            return (
              <div key={period} className="flex flex-col gap-1">
                <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-1 select-none">
                  {period}
                </h4>
                {items.map((chat) => (
                  <div key={chat.id} className="group relative">
                    <Link href={`/chat/${chat.id}`}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-10 px-3 font-normal text-sm overflow-hidden rounded-lg transition-all",
                          pathname === `/chat/${chat.id}` 
                            ? "bg-muted dark:bg-muted/60 text-foreground font-medium" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <MessageSquare className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          pathname === `/chat/${chat.id}` ? "text-primary" : "opacity-50"
                        )} />
                        <span className="truncate text-left w-full pr-6">{chat.title}</span>
                      </Button>
                    </Link>
                    
                    {/* Menu de Contexto (3 pontinhos) */}
                    <div className="absolute right-1 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background/80 rounded-md">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                           <DropdownMenuItem className="text-muted-foreground text-xs gap-2">
                              <Sparkles className="w-3 h-3" /> Renomear
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive text-xs gap-2 focus:text-destructive">
                              <Trash2 className="w-3 h-3" /> Excluir
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          
          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center opacity-50">
              <p className="text-xs">Seu histórico aparecerá aqui.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="opacity-50" />

      {/* Footer User */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer select-none">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                  {user?.name?.slice(0, 2).toUpperCase() || 'DR'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 overflow-hidden">
                 <span className="text-sm font-medium truncate text-foreground">{user?.name}</span>
                 <span className="text-[10px] text-muted-foreground truncate capitalize">{user?.plan?.toLowerCase() || 'Free'} Plan</span>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer gap-2">
                <LayoutDashboard className="w-4 h-4" /> Ir para Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive gap-2 focus:text-destructive">
              <span className="flex items-center gap-2">Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}