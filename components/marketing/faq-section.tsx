'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Preciso trocar meu sistema atual (ERP)?",
    answer: "Não! O Encaixe-Já se conecta diretamente ao seu sistema atual (ClinicWeb, Feegow, etc). Nós apenas lemos a agenda e enviamos as mensagens. Você continua usando seu ERP normalmente."
  },
  {
    question: "O paciente precisa instalar algum aplicativo?",
    answer: "Zero. O paciente recebe uma mensagem normal no WhatsApp dele. Ele responde com 'Sim' ou 'Não' e o nosso robô entende tudo. É a experiência mais simples possível para seu cliente."
  },
  {
    question: "E se dois pacientes responderem 'Sim' ao mesmo tempo?",
    answer: "Nosso sistema é 'First-Come, First-Served'. O primeiro que responder 'Sim' leva a vaga e recebe a confirmação. O segundo recebe uma mensagem educada informando que a vaga acabou de ser preenchida e que ele continua na prioridade para a próxima."
  },
  {
    question: "Consigo configurar o horário de envio das mensagens?",
    answer: "Sim. Você define janelas de disparo (ex: das 08h às 18h) para não incomodar pacientes de madrugada. Tudo configurável no seu painel."
  },
  {
    question: "Existe fidelidade ou multa de cancelamento?",
    answer: "Nenhuma. Você pode cancelar a qualquer momento no plano mensal. Acreditamos que você vai ficar pelo resultado que entregamos, não por contrato."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-zinc-900/30 border-y border-zinc-800/50">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Header FAQ */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-3xl font-bold text-white">Dúvidas Frequentes</h2>
            <p className="text-zinc-400">
              Não achou o que procurava? <br/>
              Entre em contato com nosso suporte via chat.
            </p>
          </div>

          {/* Accordion */}
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={cn(
                  "border border-zinc-800 rounded-lg bg-zinc-950/50 overflow-hidden transition-all duration-300",
                  openIndex === index ? "border-zinc-700 bg-zinc-900/80" : "hover:border-zinc-700"
                )}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex items-center justify-between w-full p-5 text-left"
                >
                  <span className={cn("font-medium text-lg", openIndex === index ? "text-white" : "text-zinc-400")}>
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-zinc-500 transition-transform duration-300",
                      openIndex === index ? "rotate-180 text-amber-500" : ""
                    )} 
                  />
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 pb-5 text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}