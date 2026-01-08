"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { motion, AnimatePresence } from "framer-motion";
import { UsageCard } from "./usage-card"; // <--- Importando o novo componente
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  CalendarDays, 
  ShieldAlert,  
  BarChart3,    
  LifeBuoy,
  X,
  CreditCard // Se não estiver usando, pode remover
} from "lucide-react";

// --- DEFINIÇÃO DAS ROTAS ---
const menuItems = [
  { title: "Visão Geral", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
  { title: "Listas de Espera", href: "/dashboard/waitlists", icon: CalendarDays, roles: ["MANAGER"] },
  { title: "Pacientes", href: "/dashboard/patients", icon: Users, roles: ["MANAGER"] },
  { title: "Assinatura", href: "/dashboard/settings/billing", icon: Settings, roles: ["MANAGER"] },
  { title: "Gestão de Clientes", href: "/admin/tenants", icon: BarChart3, roles: ["ADMIN"] },
  { title: "Logs do Sistema", href: "/admin/logs", icon: ShieldAlert, roles: ["ADMIN"] },
];

interface SidebarProps {
  userRole?: string;
  usageData?: {
    plan: "FREE" | "ESSENTIAL" | "PRO" | "PLUS";
    used: number;
    limit: number;
  };
}

export function Sidebar({ userRole = "MANAGER", usageData }: SidebarProps) {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();

  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));
  const hasPlanData = !!usageData && userRole !== "ADMIN";

  return (
    <>
      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR CONTAINER --- */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out flex flex-col",
          isMobile 
            ? "w-72" 
            : (isCollapsed ? "w-[90px]" : "w-72"),
          isMobile && (isCollapsed ? "-translate-x-full" : "translate-x-0")
        )}
      >
        {/* BOTÃO FLUTUANTE (Desktop) */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-md transition-all hover:bg-amber-50 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-amber-500",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            )}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        )}

        {/* BOTÃO FECHAR (Mobile) */}
        {isMobile && !isCollapsed && (
           <button
             onClick={toggleSidebar}
             className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-red-500 transition-colors"
           >
             <X className="h-6 w-6" />
           </button>
        )}

        <div className="flex flex-col h-full px-4 py-6">
          
          {/* --- HEADER --- */}
          <div className={cn("flex items-center mb-8 transition-all duration-300", isCollapsed && !isMobile ? "justify-center" : "pl-2")}>
            <Logo isCollapsed={isCollapsed && !isMobile} />
          </div>

          {/* --- MENU --- */}
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
            {filteredItems.map((item, index) => {
              const isActive = pathname === item.href;
              const showText = isMobile || !isCollapsed;

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => isMobile && toggleSidebar()}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                    isActive 
                      ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/30 text-amber-700 dark:text-amber-400" 
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
                    !showText && "justify-center px-0"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 h-full w-1 rounded-r-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                  )}

                  <item.icon 
                    className={cn(
                      "h-6 w-6 shrink-0 transition-all duration-300", 
                      isActive ? "text-amber-600 dark:text-amber-500 scale-110 drop-shadow-sm" : "group-hover:scale-105"
                    )} 
                  />

                  <AnimatePresence>
                    {showText && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap overflow-hidden font-semibold tracking-wide"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>

          {/* --- USAGE CARD (Novo Componente) --- */}
          {/* Só renderiza se a sidebar estiver expandida e tiver dados */}
          <AnimatePresence>
            {!isCollapsed && hasPlanData && usageData && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <UsageCard usageData={usageData} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- FOOTER --- */}
          <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1">
            <Link
               href="/dashboard/help"
               className={cn(
                 "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-amber-600 hover:bg-amber-50/50",
                 !isMobile && isCollapsed && "justify-center"
               )}
            >
               <LifeBuoy className="h-5 w-5 shrink-0" />
               <AnimatePresence>
                 {(isMobile || !isCollapsed) && (
                   <motion.span
                     initial={{ opacity: 0, width: 0 }}
                     animate={{ opacity: 1, width: "auto" }}
                     exit={{ opacity: 0, width: 0 }}
                   >
                     Suporte
                   </motion.span>
                 )}
               </AnimatePresence>
            </Link>

             <button
               className={cn(
                 "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/10 justify-start transition-colors",
                 !isMobile && isCollapsed && "justify-center px-0"
               )}
             >
               <LogOut className="h-5 w-5 shrink-0" />
               <AnimatePresence>
                  {(isMobile || !isCollapsed) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      Sair
                    </motion.span>
                  )}
               </AnimatePresence>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}