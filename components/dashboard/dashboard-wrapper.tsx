'use client';

import { useSidebar } from "@/components/ui/sidebar-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <motion.main
      initial={false}
      animate={{ 
        marginLeft: expanded ? 280 : 80,
        width: `calc(100% - ${expanded ? 280 : 80}px)`
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-1 flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950"
    >
      {children}
    </motion.main>
  );
}