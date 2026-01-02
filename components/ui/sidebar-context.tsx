'use client';

import React, { createContext, useContext, useState } from 'react';

type SidebarContextType = {
  expanded: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  const toggle = () => setExpanded((curr) => !curr);

  return (
    <SidebarContext.Provider value={{ expanded, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}