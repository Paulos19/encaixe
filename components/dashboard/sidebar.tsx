"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Logo } from "@/components/logo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  MoreVertical,
  ShieldCheck,
  User
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface SidebarProps {
  userRole?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ userRole = "MANAGER", user }: SidebarProps) {
  const pathname = usePathname();
  const { expanded, toggle } = useSidebar();

  const filteredNavItems = navItems.filter((item) => 
    item.roles.includes(userRole)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 280 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col",
        "border-r border-white/5 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl", // Vidro Escuro Premium
        "dark:from-zinc-950 dark:to-black"
      )}
    >
      {/* --- HEADER --- */}
      <div className="flex h-20 items-center justify-between px-4 shrink-0 relative">
        <div className={cn("transition-all duration-300", expanded ? "opacity-100" : "opacity-0 md:opacity-100")}>
           <Logo collapsed={!expanded} />
        </div>
        
        {/* Botão de Toggle Flutuante (Desktop) */}
        <button 
          onClick={toggle} 
          className={cn(
            "hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-amber-500 hover:text-white transition-all shadow-md absolute",
            expanded ? "right-4" : "left-1/2 -translate-x-1/2 top-24" // Move para baixo se colapsado
          )}
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* --- NAV ITEMS --- */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <TooltipProvider delayDuration={0}>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            
            // Lógica de Ativo Estrita: Evita que /dashboard fique aceso quando estiver em /dashboard/settings
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname.startsWith(item.href);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className="block outline-none">
                    <div
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group overflow-hidden cursor-pointer",
                        isActive 
                          ? "text-amber-500" // Texto ativo
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5" // Hover inativo
                      )}
                    >
                      {/* Fundo Ativo (Animado) */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-bg"
                          className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}

                      {/* Barra Lateral Dourada (Indicador) */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-amber-300 to-amber-600 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          transition={{ duration: 0.2 }}
                        />
                      )}

                      {/* Ícone */}
                      <Icon className={cn(
                        "h-5 w-5 shrink-0 z-10 transition-colors duration-300", 
                        isActive ? "stroke-amber-500 fill-amber-500/10" : "group-hover:stroke-zinc-100"
                      )} />
                      
                      {/* Texto com Animação de Saída Rápida */}
                      <AnimatePresence mode="wait">
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="font-medium whitespace-nowrap overflow-hidden z-10 text-sm"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right" className="bg-zinc-900 border-amber-500/20 text-amber-500 font-medium z-50">
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* --- FOOTER (USER PROFILE) --- */}
      <div className="p-3 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div 
              className={cn(
                "group flex items-center gap-3 rounded-2xl p-2 transition-all cursor-pointer border border-transparent",
                expanded 
                  ? "bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700" 
                  : "justify-center hover:bg-zinc-800"
              )}
            >
              <div className="relative">
                <Avatar className="h-9 w-9 border border-zinc-700 group-hover:border-amber-500/50 transition-colors">
                  <AvatarImage src={user?.image || ""} />
                  <AvatarFallback className="bg-zinc-800 text-amber-500 font-bold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || "CN"}
                  </AvatarFallback>
                </Avatar>
                {/* Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-1 flex-col overflow-hidden text-left"
                  >
                    <span className="truncate text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {user?.name || "Usuário"}
                    </span>
                    
                    {/* Role Badge Animada */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                       {userRole === 'ADMIN' ? (
                         <ShieldCheck className="h-3 w-3 text-amber-500" />
                       ) : (
                         <User className="h-3 w-3 text-zinc-500" />
                       )}
                       <span className={cn(
                         "text-[10px] uppercase tracking-wider font-bold",
                         userRole === 'ADMIN' 
                           ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600" 
                           : "text-zinc-500"
                       )}>
                         {userRole === 'ADMIN' ? 'Admin Master' : 'Gerente'}
                       </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {expanded && (
                 <MoreVertical className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
             <div className="flex flex-col p-2 gap-1 mb-1 border-b border-zinc-800">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
             </div>
             <DropdownMenuItem className="focus:bg-zinc-900 focus:text-amber-500 cursor-pointer">
                Configurações da Conta
             </DropdownMenuItem>
             {userRole === 'ADMIN' && (
                <DropdownMenuItem className="focus:bg-zinc-900 focus:text-amber-500 cursor-pointer">
                   Painel Global
                </DropdownMenuItem>
             )}
             <DropdownMenuItem 
               className="text-red-500 focus:bg-red-950/20 focus:text-red-400 cursor-pointer mt-1"
               onClick={() => signOut({ callbackUrl: "/login" })}
             >
                <LogOut className="mr-2 h-4 w-4" /> Sair
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}