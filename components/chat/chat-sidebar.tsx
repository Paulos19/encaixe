'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Plus, LayoutDashboard, Settings, MoreHorizontal, Trash2, Search } from 'lucide-react';
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

// Tipagem baseada no Prisma
type ChatSession = {
  id: string;
  title: string;
  updatedAt: Date;
};

interface ChatSidebarProps {
  user?: any;
  sessions: ChatSession[]; // Recebe dados reais agora
}

export function ChatSidebar({ user, sessions }: ChatSidebarProps) {
  const pathname = usePathname();

  // Agrupamento simples por data (Hoje, Ontem, Antigos)
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const key = isToday ? 'Hoje' : 'Anteriores';
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  return (
    <div className="flex flex-col h-full bg-background border-r w-full">
      {/* Header: Novo Chat */}
      <div className="p-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 h-10 border-primary/20 hover:bg-primary/5 text-primary"
          asChild
        >
          <Link href="/chat">
            <Plus className="w-4 h-4" />
            <span className="font-medium">Nova Conversa</span>
          </Link>
        </Button>
      </div>

      <div className="px-3 pb-2">
         <div className="relative">
           <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
           <Input placeholder="Buscar conversas..." className="pl-8 h-8 text-xs bg-muted/30 border-muted" />
         </div>
      </div>

      {/* Lista de Histórico Real */}
      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-4 py-2">
          {Object.entries(groupedSessions).map(([period, items]) => (
            <div key={period} className="flex flex-col gap-1">
              <h4 className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider px-2 mb-1">
                {period}
              </h4>
              {items.map((chat) => (
                <div key={chat.id} className="group relative">
                  <Link href={`/chat/${chat.id}`}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 h-9 px-2 font-normal text-sm overflow-hidden",
                        pathname === `/chat/${chat.id}` 
                          ? "bg-muted font-medium text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span className="truncate text-left w-full pr-6">{chat.title}</span>
                    </Button>
                  </Link>
                  
                  {/* Menu de Contexto */}
                  <div className="absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                         <DropdownMenuItem className="text-destructive text-xs">
                            <Trash2 className="w-3 h-3 mr-2" /> Excluir
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">Nenhum histórico ainda.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-3 flex flex-col gap-1">
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 px-2 text-muted-foreground" asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">Voltar ao Dashboard</span>
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 px-2 py-2 mt-1">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user?.image} />
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
             <span className="text-sm font-medium truncate">{user?.name}</span>
             <span className="text-[10px] text-muted-foreground truncate capitalize">{user?.plan?.toLowerCase()} Plan</span>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
        </div>
      </div>
    </div>
  );
}