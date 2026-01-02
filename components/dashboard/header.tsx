"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Menu, 
  Bell, 
  Sun, 
  CloudRain, 
  Cloud, 
  Snowflake,
  Clock,
  Search,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- WIDGET DE RELÓGIO (BRASÍLIA) ---
function TimeWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date()); // Define a hora inicial no client-side
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null; // Evita hydration mismatch

  return (
    <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 md:flex">
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      <span>
        {new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        }).format(time)}
        <span className="mx-1 animate-pulse text-amber-500">:</span>
        {new Intl.DateTimeFormat("pt-BR", {
          second: "2-digit",
          timeZone: "America/Sao_Paulo",
        }).format(time)}
      </span>
      <span className="ml-1 text-[10px] uppercase text-zinc-400">BRT</span>
    </div>
  );
}

// --- WIDGET DE CLIMA (API OPEN-METEO) ---
function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Coordenadas de Brasília (pode parametrizar depois)
  const LAT = -15.7975;
  const LON = -47.8919;

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true`
        );
        const data = await res.json();
        setWeather({
          temp: data.current_weather.temperature,
          code: data.current_weather.weathercode,
        });
      } catch (error) {
        console.error("Erro ao carregar clima", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  // Seleciona ícone baseado no código WMO
  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="h-3.5 w-3.5 text-amber-500" />;
    if (code <= 67) return <CloudRain className="h-3.5 w-3.5 text-blue-400" />;
    if (code <= 77) return <Snowflake className="h-3.5 w-3.5 text-cyan-300" />;
    return <Cloud className="h-3.5 w-3.5 text-zinc-400" />;
  };

  if (loading) return <div className="h-8 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />;
  if (!weather) return null;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 md:flex transition-all hover:bg-white dark:hover:bg-zinc-900">
      {getWeatherIcon(weather.code)}
      <span>{Math.round(weather.temp)}°C</span>
      <span className="hidden lg:inline text-zinc-400 text-[10px] ml-1">Brasília</span>
    </div>
  );
}

// --- HEADER PRINCIPAL ---
interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { toggleSidebar } = useSidebar();

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-zinc-200 bg-white/70 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/60">
      
      {/* 1. ÁREA ESQUERDA: Toggle e Título */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb / Título Estilizado */}
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            Dashboard
            <span className="hidden rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 sm:inline-block">
              PRO
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Visão geral do sistema
          </p>
        </div>
      </div>

      {/* 2. ÁREA CENTRAL: Widgets (Barra de Pesquisa pode entrar aqui futuramente) */}
      <div className="hidden flex-1 items-center justify-center gap-4 lg:flex">
         {/* Barra de Pesquisa Fantasma (Estética) */}
         <div className="relative group w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
               <Search className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <input 
              type="text" 
              className="w-full rounded-full border border-zinc-200 bg-zinc-50/50 py-2 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 transition-all"
              placeholder="Buscar pedidos, clientes..." 
            />
         </div>
      </div>

      {/* 3. ÁREA DIREITA: Widgets de Info e Perfil */}
      <div className="flex items-center gap-3">
        
        {/* Widgets de Informação */}
        <div className="flex items-center gap-2 mr-2">
          <TimeWidget />
          <WeatherWidget />
        </div>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-black animate-pulse" />
        </Button>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Dropdown do Usuário (Estilo Card) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex h-10 items-center gap-2 rounded-full pl-1 pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400 font-bold">
                  {getInitials(user.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-xs font-semibold leading-none">{user.name?.split(' ')[0]}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{user.role}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56 mt-2 rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-xl shadow-xl dark:border-zinc-800 dark:bg-zinc-950/95" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{user.name}</p>
                <p className="text-xs leading-none text-zinc-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer focus:bg-amber-50 focus:text-amber-700 dark:focus:bg-amber-950/30 dark:focus:text-amber-500 rounded-lg mx-1">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-amber-50 focus:text-amber-700 dark:focus:bg-amber-950/30 dark:focus:text-amber-500 rounded-lg mx-1">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/20 rounded-lg mx-1 mb-1"
              // onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}