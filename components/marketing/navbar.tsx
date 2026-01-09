'use client';

import Link from "next/link";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, ArrowRight } from "lucide-react";

export function Navbar({ session }: { session: any }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const navLinks = [
    { name: "Funcionalidades", href: "#features" },
    { name: "Como Funciona", href: "#how-it-works" },
    { name: "Preços", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled 
          ? "bg-zinc-950/80 backdrop-blur-md border-zinc-800 py-3" 
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
            <Zap className="h-5 w-5 text-white fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Encaixe<span className="text-amber-500">Já</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold rounded-full px-6">
                Ir para Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white">
                Entrar
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-full px-6 shadow-lg shadow-amber-900/20">
                  Começar Grátis
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-zinc-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-zinc-400 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-zinc-800 my-2" />
          {session ? (
             <Link href="/dashboard">
                <Button className="w-full bg-zinc-100 text-zinc-900">Dashboard</Button>
             </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="ghost" className="w-full justify-start text-zinc-300">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full bg-amber-600">Criar Conta</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}