import { Inter } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Encaixe-Já | Preencha horários vagos automaticamente",
  description: "O sistema inteligente que transforma cancelamentos em receita via WhatsApp.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-h-screen bg-zinc-950 text-zinc-50 selection:bg-amber-500/30", inter.className)}>
      {/* Background Grid Global */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-amber-500 opacity-20 blur-[100px]"></div>
      </div>
      
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}