import { Logo } from "@/components/dashboard/logo";
import { AmbientBackground } from "@/components/ui/ambient-background"; // Se tiver, senão remove

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen grid lg:grid-cols-2 overflow-hidden">
      
      {/* LADO ESQUERDO (Visual) - Oculto no Mobile */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 bg-zinc-900 text-white overflow-hidden">
        {/* Fundo Decorativo */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-zinc-900/10" />
        
        {/* Conteúdo sobreposto */}
        <div className="relative z-10">
          <Logo isCollapsed={false} className="text-white scale-110 origin-left" />
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <blockquote className="space-y-2">
            <p className="text-2xl font-medium leading-relaxed">
              "O Encaixe Já transformou a nossa recepção. Menos telefone, mais pacientes atendidos e zero buracos na agenda."
            </p>
            <footer className="text-sm text-zinc-400">
              Dra. Ana Beatriz &mdash; Dermatologista
            </footer>
          </blockquote>
        </div>
      </div>

      {/* LADO DIREITO (Formulário) */}
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 relative">
        <div className="absolute top-6 right-6 lg:hidden">
           <Logo isCollapsed={false} />
        </div>

        <div className="w-full max-w-[400px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
          
          <div className="text-center text-xs text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Encaixe Já. Segurança e Eficiência.
          </div>
        </div>
      </div>
    </div>
  );
}