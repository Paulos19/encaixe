'use client';

import { motion } from "framer-motion";
import { 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  Zap, 
  MoreHorizontal, 
  Calendar,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- COMPONENTES VISUAIS (MOCK UI) ---

// 1. Visual da Lista de Espera
const WaitlistVisual = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] perspective-1000">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl rounded-full opacity-50" />
      
      {/* Container Principal */}
      <motion.div 
        initial={{ rotateY: -10, rotateX: 5 }}
        whileInView={{ rotateY: 0, rotateX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative z-10 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Header da Tabela */}
        <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-amber-500/50" />
            <span className="text-xs font-semibold text-zinc-400 ml-2">Lista de Espera: Dr. Marco</span>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px]">
            Em Andamento
          </Badge>
        </div>

        {/* Linhas da Tabela */}
        <div className="p-2 space-y-2">
          {/* Paciente 1 (O que vai ser confirmado) */}
          <motion.div 
            initial={{ x: 0 }}
            whileInView={{ x: [0, 10, 0], scale: [1, 1.02, 1], backgroundColor: ["rgba(24, 24, 27, 0)", "rgba(16, 185, 129, 0.1)", "rgba(24, 24, 27, 0)"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-zinc-700">
                <AvatarFallback className="bg-zinc-800 text-xs">AS</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-200">Ana Silva</span>
                <span className="text-[10px] text-zinc-500">Há 2 dias</span>
              </div>
            </div>
            <motion.div
               animate={{ 
                 opacity: [1, 0, 1],
                 scale: [1, 0.8, 1] 
               }}
               transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
               {/* Troca de Badges Simulada */}
               <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                 Confirmado
               </Badge>
            </motion.div>
          </motion.div>

          {/* Outros Pacientes (Estáticos) */}
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-transparent opacity-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-800" />
                <div className="space-y-1">
                  <div className="h-2 w-20 bg-zinc-800 rounded" />
                  <div className="h-2 w-12 bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Card Flutuante - Notificação */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: -20, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute -right-6 bottom-10 z-20 bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl flex items-center gap-3 w-48"
      >
        <div className="bg-amber-500/20 p-2 rounded-full text-amber-500">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-zinc-400">Tempo Economizado</p>
          <p className="text-sm font-bold text-white">45 minutos</p>
        </div>
      </motion.div>
    </div>
  );
};

// 2. Visual do WhatsApp
const WhatsAppVisual = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3]">
      {/* Phone Mockup */}
      <div className="absolute inset-0 bg-zinc-900 rounded-[2rem] border-[6px] border-zinc-800 overflow-hidden shadow-2xl">
        {/* Header do Chat */}
        <div className="bg-[#075E54] p-4 flex items-center gap-3 pt-8">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
            C
          </div>
          <div>
            <p className="text-white text-xs font-bold">Clínica Saúde</p>
            <p className="text-white/70 text-[10px]">Online</p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-10 h-full">
          
          {/* Mensagem Bot */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg rounded-tl-none p-3 max-w-[80%] shadow-sm relative"
          >
            <p className="text-xs text-zinc-800">
              Olá! Surgiu uma vaga com <strong>Dr. Marco</strong> para amanhã às <strong>14:30</strong>. Deseja agendar?
            </p>
            <span className="text-[9px] text-zinc-400 absolute bottom-1 right-2">10:00</span>
          </motion.div>

          {/* Resposta Paciente */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5 }} // Atraso para simular tempo de resposta
            className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 max-w-[80%] shadow-sm ml-auto relative"
          >
            <p className="text-xs text-zinc-800">Sim, quero!</p>
            <div className="absolute bottom-1 right-2 flex items-center gap-0.5">
               <span className="text-[9px] text-zinc-500">10:05</span>
               <CheckCircle2 className="h-2 w-2 text-blue-500" />
            </div>
          </motion.div>

          {/* Confirmação Bot */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2.5 }}
            className="bg-white rounded-lg rounded-tl-none p-3 max-w-[80%] shadow-sm"
          >
            <p className="text-xs text-zinc-800 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Agendado com sucesso!
            </p>
          </motion.div>

        </div>
      </div>

      {/* Elemento Decorativo Flutuante */}
      <motion.div 
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-4 top-20 z-10 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-2"
      >
        <Smartphone className="h-4 w-4" />
        <span className="text-xs font-bold">Taxa de Resposta: 98%</span>
      </motion.div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export function FeaturesSection() {
  const features = [
    {
      title: "Fila de Espera Automática",
      description: "Esqueça as planilhas e o caos. O sistema organiza seus pacientes por prioridade e tempo de espera. Quando uma vaga surge, ele sabe exatamente quem chamar primeiro.",
      icon: <Calendar className="h-6 w-6 text-amber-500" />,
      visual: <WaitlistVisual />,
      align: "left"
    },
    {
      title: "Comunicação via WhatsApp",
      description: "Seus pacientes já estão no WhatsApp. Nosso bot envia ofertas de horário de forma humanizada e processa a resposta ('Sim' ou 'Não') instantaneamente.",
      icon: <MessageCircle className="h-6 w-6 text-green-500" />,
      visual: <WhatsAppVisual />,
      align: "right"
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 space-y-32">
        
        {/* HEADER DA SEÇÃO */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Poderoso. Simples. <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-600">
              Totalmente Autônomo.
            </span>
          </h2>
          <p className="text-lg text-zinc-400">
            Elimine o trabalho manual da sua secretária e deixe nosso algoritmo preencher sua agenda.
          </p>
        </div>

        {/* FEATURES LOOP */}
        {features.map((feature, index) => (
          <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${feature.align === 'right' ? 'lg:flex-row-reverse' : ''}`}>
            
            {/* Texto */}
            <motion.div 
              initial={{ opacity: 0, x: feature.align === 'left' ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1 space-y-6"
            >
              <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-3xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-lg text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-3 pt-4">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-zinc-600" />
                    <span>Benefício chave {item} detalhado aqui</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Visual 3D */}
            <div className="flex-1 w-full">
               {feature.visual}
            </div>

          </div>
        ))}

      </div>

      {/* Grid Background Local */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 pointer-events-none" />
    </section>
  );
}