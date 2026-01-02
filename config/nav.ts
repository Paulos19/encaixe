import { LayoutDashboard, Users, CalendarDays, Settings, ShieldAlert, BarChart3 } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: any;
  roles: string[]; // Quem pode ver?
};

export const navItems: NavItem[] = [
  // Rotas Comuns / Manager
  {
    title: "Visão Geral",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "Listas de Espera",
    href: "/dashboard/waitlists",
    icon: CalendarDays,
    roles: ["MANAGER"],
  },
  {
    title: "Pacientes",
    href: "/dashboard/patients",
    icon: Users,
    roles: ["MANAGER"],
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["MANAGER"],
  },
  // Rotas Exclusivas de Admin (SaaS Owner)
  {
    title: "Gestão de Clientes",
    href: "/admin/tenants",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  {
    title: "Logs do Sistema",
    href: "/admin/logs",
    icon: ShieldAlert,
    roles: ["ADMIN"],
  },
];