import Link from "next/link";
import { Zap, Instagram, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white fill-current" />
              </div>
              <span className="font-bold text-lg text-white">
                Encaixe<span className="text-amber-500">Já</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500">
              Automação inteligente para clínicas que não querem perder tempo nem dinheiro.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="#features" className="hover:text-amber-500">Funcionalidades</Link></li>
              <li><Link href="#pricing" className="hover:text-amber-500">Preços</Link></li>
              <li><Link href="/login" className="hover:text-amber-500">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="#" className="hover:text-amber-500">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-amber-500">Privacidade</Link></li>
              <li><Link href="#" className="hover:text-amber-500">LGPD</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Social</h4>
            <div className="flex gap-4">
              <Link href="#" className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} Encaixe-Já. Todos os direitos reservados.</p>
          <p>Feito com ⚡ no Brasil.</p>
        </div>
      </div>
    </footer>
  );
}