"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar-context";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { motion, AnimatePresence } from "framer-motion";
import { UsageCard } from "./usage-card"; 
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
  Headset, // Ícone para representar "Comercial" antes do hover
  X,
} from "lucide-react";

// --- ÍCONE WHATSAPP (SVG Otimizado) ---
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

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

  // Configuração do WhatsApp
  const phoneNumber = "554191942028";
  const message = encodeURIComponent("Olá! Sou cliente do Encaixe Já e gostaria de falar com o suporte/comercial.");
  const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

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
          <div className={cn("flex-none mb-6 transition-all duration-300", isCollapsed && !isMobile ? "justify-center" : "pl-2")}>
            <Logo isCollapsed={isCollapsed && !isMobile} />
          </div>

          {/* --- MENU --- */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-1">
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

          {/* --- USAGE CARD --- */}
          <AnimatePresence>
            {!isCollapsed && hasPlanData && usageData && (
              <div className="flex-none mt-2">
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   exit={{ opacity: 0, height: 0 }}
                >
                  <UsageCard usageData={usageData} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* --- FOOTER (SUPORTE PREMIUM + SAIR) --- */}
          <div className="flex-none mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
            
            {/* LINK DO WHATSAPP (BOTÃO DE DESTAQUE) */}
            <motion.a
               href={whatsappLink}
               target="_blank"
               rel="noopener noreferrer"
               className={cn(
                 "relative group flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden",
                 // Gradiente Linear de Destaque
                 "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
                 !isMobile && isCollapsed ? "aspect-square p-0" : "w-full"
               )}
               initial={false}
               whileTap={{ scale: 0.98 }}
            >
               {/* Efeito de Brilho no Hover */}
               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

               {/* Container de Ícones com troca suave */}
               <div className="relative h-5 w-5 shrink-0">
                  {/* Ícone 1: Headset (Default) */}
                  <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                    <Headset className="h-5 w-5" />
                  </div>
                  {/* Ícone 2: WhatsApp (Hover) */}
                  <div className="absolute inset-0 flex items-center justify-center translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <WhatsAppIcon className="h-5 w-5 fill-white" />
                  </div>
               </div>
               
               {/* Texto Comercial & Suporte */}
               <AnimatePresence>
                 {(isMobile || !isCollapsed) && (
                   <motion.span
                     initial={{ opacity: 0, width: 0 }}
                     animate={{ opacity: 1, width: "auto" }}
                     exit={{ opacity: 0, width: 0 }}
                     className="whitespace-nowrap overflow-hidden z-10 text-shadow-sm"
                   >
                    Suporte
                   </motion.span>
                 )}
               </AnimatePresence>
            </motion.a>

            {/* BOTÃO SAIR */}
             <button
               className={cn(
                 "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/10 justify-start transition-colors",
                 !isMobile && isCollapsed && "justify-center px-0"
               )}
               // Adicione onClick={() => signOut()}
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