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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar-context'; // [Novo]
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const { isCollapsed, toggleSidebar } = useSidebar(); // Consumindo contexto

  // Agrupamento por data (Lógica mantida)
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

  const order = ['Hoje', 'Ontem', '7 Dias', 'Anteriores'];

  // Helper para renderizar botão com Tooltip se colapsado
  const SidebarItem = ({ icon: Icon, label, active, href, onClick }: any) => {
    const content = (
      <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
          "w-full h-10 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-start px-3 gap-3",
          active 
            ? "bg-muted dark:bg-muted/60 text-foreground font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        )}
      >
        <Icon className={cn("shrink-0 transition-colors", active ? "text-primary" : "opacity-70", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{href ? <Link href={href} className="w-full block">{content}</Link> : content}</TooltipTrigger>
            <TooltipContent side="right"><p>{label}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return href ? <Link href={href} className="w-full block">{content}</Link> : content;
  };

  return (
    // ASIDE agora é controlado pelo componente e não pelo Layout pai
    <aside 
      className={cn(
        "hidden md:flex flex-col h-full bg-muted/5 border-r border-border/40 shrink-0 transition-all duration-300 ease-in-out relative z-20",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      {/* Botão de Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-sm z-30 hover:bg-accent text-muted-foreground hidden md:flex"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </Button>

      {/* Header da Sidebar */}
      <div className={cn("p-4 pb-2 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed ? (
          <Button 
            className="w-full justify-start gap-3 h-11 bg-background border border-border/50 shadow-sm hover:bg-muted/50 text-foreground transition-all rounded-xl group"
            asChild
          >
            <Link href="/chat">
              <div className="bg-primary/10 text-primary p-1 rounded-lg group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-medium">Nova Conversa</span>
            </Link>
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background border border-border/50 shadow-sm" asChild>
                   <Link href="/chat"><Plus className="w-5 h-5 text-primary" /></Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Nova Conversa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Lista de Conversas (Scrollbar Invisível) */}
      <div className="flex-1 overflow-hidden hover:overflow-y-auto scrollbar-hover px-3 py-2">
        <div className="flex flex-col gap-6">
          {order.map((period) => {
            const items = groupedSessions[period];
            if (!items || items.length === 0) return null;

            return (
              <div key={period} className="flex flex-col gap-1">
                {!isCollapsed && (
                  <h4 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3 mb-1 select-none animate-in fade-in duration-300">
                    {period}
                  </h4>
                )}
                {isCollapsed && <Separator className="my-2 opacity-50" />}
                
                {items.map((chat) => (
                  <div key={chat.id} className="group relative">
                    <SidebarItem 
                      href={`/chat/${chat.id}`}
                      icon={MessageSquare}
                      label={chat.title}
                      active={pathname === `/chat/${chat.id}`}
                    />
                    
                    {/* Menu de Contexto (Apenas visível se expandido para não poluir UI colapsada) */}
                    {!isCollapsed && (
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
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Footer User */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className={cn("w-full h-auto py-2 px-2 hover:bg-muted/50 rounded-xl", isCollapsed ? "justify-center" : "justify-start gap-3")}>
                <Avatar className="h-8 w-8 border border-border/50">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {user?.name?.slice(0, 2).toUpperCase() || 'DR'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-sm font-medium truncate w-full text-foreground">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate capitalize">{user?.plan?.toLowerCase() || 'Free'} Plan</span>
                  </div>
                )}
                {!isCollapsed && <Settings className="w-4 h-4 text-muted-foreground ml-auto" />}
             </Button>
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
    </aside>
  );
}