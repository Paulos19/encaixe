import { Logo } from "@/components/dashboard/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Background Pattern Sutil */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
      
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo Animada Centralizada */}
        <div className="flex justify-center mb-8">
           <div className="scale-125">
              <Logo isCollapsed={false} />
           </div>
        </div>

        {children}
        
        {/* Footerzinho */}
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Encaixe Já. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}