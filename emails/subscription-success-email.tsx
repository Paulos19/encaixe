import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr
} from "@react-email/components";
import * as React from "react";

interface SubscriptionSuccessEmailProps {
  name: string;
  planName: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const SubscriptionSuccessEmail = ({ name, planName }: SubscriptionSuccessEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sua assinatura foi confirmada! 🚀</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#10b981", // Emerald-500 (Verde de Sucesso)
              },
            },
          },
        }}
      >
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Section className="mt-[20px] mb-[32px] text-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                 🎉
               </div>
            </Section>

            <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0">
              Pagamento Confirmado!
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px] text-center">
              Parabéns, <strong>{name}</strong>! Agora você é membro <strong>{planName}</strong> do Encaixe Já.
            </Text>

            <Section className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 my-6 text-center">
               <Text className="uppercase text-xs font-bold text-zinc-500 tracking-wider mb-2">Seu Novo Limite</Text>
               <Heading className="text-brand text-4xl font-black m-0">
                  {planName === 'ESSENTIAL' ? '100' : planName === 'PRO' ? '300' : '800'}
               </Heading>
               <Text className="text-sm font-medium text-zinc-600 mt-2">Mensagens / mês</Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-zinc-900 rounded text-white text-[14px] font-bold no-underline text-center px-5 py-3"
                href={`${baseUrl}/dashboard`}
              >
                Começar a Usar Agora
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              Obrigado por confiar no Encaixe Já.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};