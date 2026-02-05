"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Estado inicial padrão (Expandido = false) para bater com o SSR
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Flag para garantir que estamos no cliente antes de acessar localStorage
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isSmall = width < 768;
      
      setIsMobile(isSmall);
      
      // Se for mobile, força colapso. 
      // Se for desktop, mantém o estado atual ou lê do storage na inicialização
      if (isSmall) {
        setIsCollapsed(true);
      }
    };

    // 1. Check inicial de Mobile
    checkScreenSize();

    // 2. Recuperar persistência (Apenas Desktop)
    // Se não for mobile, verificamos se o usuário tinha preferência salva
    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    }

    // Listener de Resize
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    // Salva a preferência no LocalStorage
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  // Renderizamos o Provider sempre para evitar o erro "must be used within a SidebarProvider"
  // O estado 'isCollapsed' pode sofrer uma atualização rápida após o mount (de false para true se estiver salvo),
  // mas isso é necessário para compatibilidade com SSR do Next.js.
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};