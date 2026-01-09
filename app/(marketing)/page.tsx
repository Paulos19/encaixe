import { auth } from "@/auth";
import { Navbar } from "@/components/marketing/navbar";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { FeaturesSection } from "@/components/marketing/features-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { ChevronRight, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function MarketingPage() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Coluna Texto */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 z-10">
              
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-500 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                Novidade: Integração com ClinicWeb e Feegow
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
                Transforme <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                  Cancelamentos
                </span> <br />
                em Lucro Real.
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-[600px] animate-in fade-in slide-in-from-bottom-12 duration-1000">
                O sistema que detecta horários vagos na sua agenda e oferece automaticamente para sua lista de espera via WhatsApp. Sem esforço manual.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-base shadow-xl shadow-amber-900/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                    Começar Teste Grátis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 bg-transparent backdrop-blur-sm">
                  Ver Demonstração
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4 animate-in fade-in opacity-0 duration-1000 delay-500 fill-mode-forwards">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                       U{i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-zinc-400">
                   <div className="flex items-center text-amber-500 mb-0.5">
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                   </div>
                   Usado por +500 Clínicas
                </div>
              </div>

            </div>

            {/* Coluna Visual 3D */}
            <div className="relative lg:h-[600px] flex items-center justify-center animate-in fade-in zoom-in duration-1000 delay-300">
               <HeroVisual />
            </div>

          </div>
        </div>
      </section>

      {/* --- SEÇÕES ADICIONAIS --- */}
      <FeaturesSection />
      
      <PricingSection />
      
      <FAQSection />

      {/* --- CTA FINAL --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Pronto para lotar sua agenda?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Junte-se a centenas de gestores que pararam de perder dinheiro com cadeiras vazias. Configure em menos de 5 minutos.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-lg shadow-2xl hover:scale-105 transition-all">
              Criar Conta Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-zinc-500">
            7 dias grátis • Sem cartão de crédito • Cancelamento a qualquer momento
          </p>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}