import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesso - Encaixe Já",
  description: "Gerenciamento inteligente de listas de espera",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-100">
            Encaixe Já
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Gestão inteligente para sua clínica
          </p>
        </div>
        
        {/* Container do formulário */}
        {children}
      </div>
    </div>
  );
}