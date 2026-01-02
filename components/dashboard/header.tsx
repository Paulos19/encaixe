'use client';

import { useSidebar } from "@/components/ui/sidebar-context";
import { Button } from "@/components/ui/button";
import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { WeatherWidget } from "@/components/dashboard/weather-widget"; // <--- Importe aqui

interface HeaderProps {
  user: any;
}

export function Header({ user }: HeaderProps) {
  const { toggle, expanded } = useSidebar();

  return (
    <header 
      className={cn(
        "sticky top-0 z-30 flex h-20 items-center gap-4 px-6 transition-all duration-300",
        "bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50"
      )}
    >
      {/* Mobile Toggle */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggle}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
        <Input 
          placeholder="Buscar pacientes, filas..." 
          className="pl-10 bg-zinc-100/50 dark:bg-zinc-900/50 border-transparent focus:border-amber-500/50 focus:ring-amber-500/20 rounded-full transition-all duration-300"
        />
      </div>

      {/* Área Central/Direita */}
      <div className="flex-1 flex items-center justify-end gap-4">
        
        {/* WIDGET DE CLIMA E TEMPO (NOVO) */}
        <div className="hidden lg:block">
            <WeatherWidget />
        </div>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-amber-500/10 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-950 animate-pulse" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-amber-500/30 transition-all p-0">
              <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-black text-amber-500 font-bold">
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer focus:text-amber-500 focus:bg-amber-500/10">Perfil</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:text-amber-500 focus:bg-amber-500/10">Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer focus:bg-red-500/10">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}