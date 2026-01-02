import { cn } from "@/lib/utils";

export function GradientText({ children, className, size = "xl" }: { children: React.ReactNode, className?: string, size?: "lg" | "xl" | "2xl" | "4xl" }) {
  const sizes = {
    lg: "text-lg font-semibold",
    xl: "text-xl font-bold",
    "2xl": "text-2xl font-bold tracking-tight",
    "4xl": "text-4xl font-extrabold tracking-tight",
  };

  return (
    <span className={cn(
      sizes[size],
      // Forçamos o 'pb-1' (padding bottom) para garantir que descenders da fonte não cortem o gradiente
      "inline-block pb-1 bg-clip-text text-transparent",
      // Gradiente Dourado Padrão (Agora mais vibrante)
      "bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600",
      className
    )}>
      {children}
    </span>
  );
}