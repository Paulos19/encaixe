"use client";

import { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react"; // <--- Importante para logout
import { globalSearch } from "@/app/actions/search"; // <--- Importante para busca

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
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
  ChevronDown,
  AlertCircle,
  Loader2,
  Users,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- HELPERS E CONFIGURAÇÕES ---

const PLAN_STYLES: Record<string, string> = {
  FREE: "bg-zinc-100 text-zinc-600 border-zinc-200",
  ESSENTIAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PRO: "bg-amber-100 text-amber-700 border-amber-200",
  PLUS: "bg-violet-100 text-violet-700 border-violet-200",
};

// --- WIDGET DE RELÓGIO ---
function TimeWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 md:flex">
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      <span>
        {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(time)}
        <span className="mx-1 animate-pulse text-amber-500">:</span>
        {new Intl.DateTimeFormat("pt-BR", { second: "2-digit", timeZone: "America/Sao_Paulo" }).format(time)}
      </span>
      <span className="ml-1 text-[10px] uppercase text-zinc-400">BRT</span>
    </div>
  );
}

// --- WIDGET DE CLIMA ---
function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-15.7975&longitude=-47.8919&current_weather=true`);
        const data = await res.json();
        setWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="h-3.5 w-3.5 text-amber-500" />;
    return <Cloud className="h-3.5 w-3.5 text-zinc-400" />;
  };

  if (loading || !weather) return null;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 md:flex transition-all hover:bg-white">
      {getWeatherIcon(weather.code)}
      <span>{Math.round(weather.temp)}°C</span>
    </div>
  );
}

// --- BARRA DE PESQUISA FUNCIONAL ---
function SearchBar() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ patients: any[], waitlists: any[] }>({ patients: [], waitlists: [] });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        const data = await globalSearch(query);
        setResults(data);
        setIsLoading(false);
      } else {
        setResults({ patients: [], waitlists: [] });
      }
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [query]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (url: string) => {
    router.push(url);
    setActive(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative group w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
        )}
      </div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setActive(true)}
        className="w-full rounded-full border border-zinc-200 bg-zinc-50/50 py-2 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 transition-all"
        placeholder="Buscar pacientes ou listas..." 
      />
      
      {/* Resultados da Pesquisa */}
      <AnimatePresence>
        {active && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-xl z-50 overflow-hidden"
          >
             <p className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 rounded-lg mb-1">
               Resultados
             </p>
             
             {results.patients.length === 0 && results.waitlists.length === 0 && !isLoading && (
                <div className="text-center py-4 text-sm text-zinc-500">
                  Nenhum resultado encontrado.
                </div>
             )}

             <div className="max-h-[300px] overflow-y-auto space-y-1 scrollbar-hide">
                {/* Pacientes */}
                {results.patients.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => handleSelect('/dashboard/patients')} 
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 cursor-pointer text-zinc-700 transition-colors"
                  >
                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Users className="h-4 w-4" />
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-xs text-zinc-400">{p.phone}</span>
                     </div>
                  </div>
                ))}

                {/* Listas */}
                {results.waitlists.map((w) => (
                  <div 
                    key={w.id}
                    onClick={() => handleSelect(`/dashboard/waitlists/${w.id}`)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 cursor-pointer text-zinc-700 transition-colors"
                  >
                     <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Calendar className="h-4 w-4" />
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{w.name}</span>
                        <span className="text-xs text-zinc-400">Lista de Espera</span>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    plan?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { toggleSidebar } = useSidebar();
  const planName = user.plan || "FREE";
  const planStyle = PLAN_STYLES[planName] || PLAN_STYLES.FREE;

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-zinc-200 bg-white/70 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/60">
      
      {/* 1. ESQUERDA */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            Dashboard
            <span className={cn("hidden rounded px-1.5 py-0.5 text-[10px] font-bold border sm:inline-block shadow-sm", planStyle)}>
              {planName}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Visão geral do sistema</p>
        </div>
      </div>

      {/* 2. CENTRO (Busca) */}
      <div className="hidden flex-1 items-center justify-center gap-4 lg:flex">
         <SearchBar />
      </div>

      {/* 3. DIREITA */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <TimeWidget />
          <WeatherWidget />
        </div>

        {/* Notificações (Mockadas por enquanto) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-zinc-500 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-xl">
             <div className="p-4 text-center text-sm text-zinc-500">Sem notificações novas.</div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* DROPDOWN DO USUÁRIO FUNCIONAL */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex h-10 items-center gap-2 rounded-full pl-1 pr-3 hover:bg-zinc-100">
              <Avatar className="h-8 w-8 border border-zinc-200">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">{getInitials(user.name || "")}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-xs font-semibold leading-none">{user.name?.split(' ')[0]}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{user.role}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56 mt-2 rounded-xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-zinc-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/billing" className="cursor-pointer w-full flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/billing" className="cursor-pointer w-full flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Assinatura</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })} // <--- LOGOUT REAL
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