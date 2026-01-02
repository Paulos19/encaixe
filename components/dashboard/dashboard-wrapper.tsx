"use client";

import { useSidebar } from "@/components/ui/sidebar-context";
import { cn } from "@/lib/utils";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out",
        // Mobile: Sem margem (ml-0)
        // Desktop: ml-[90px] (fechado) ou ml-72 (aberto)
        isMobile 
          ? "ml-0" 
          : (isCollapsed ? "ml-[90px]" : "ml-72")
      )}
    >
      {children}
    </div>
  );
}