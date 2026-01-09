import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; 
// Importe outros providers globais aqui se necessário (ex: SessionProvider)

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Encaixe-Já",
  description: "Sistema de gestão de encaixes automático",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}