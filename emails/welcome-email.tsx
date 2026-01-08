import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  name: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const firstName = name.split(" ")[0];

  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao futuro da gestão de agenda da sua clínica.</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#f59e0b", // Amber-500
                brandDark: "#d97706",
              },
            },
          },
        }}
      >
        <Body className="bg-white my-auto mx-auto font-sans text-zinc-800">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            {/* LOGO */}
            <Section className="mt-[20px] mb-[32px] text-center">
              {/* Substitua por uma URL pública da sua logo hospedada */}
              <Img
                src={`${baseUrl}/logo-email.png`} 
                width="150"
                height="50"
                alt="Encaixe Já"
                className="mx-auto"
                style={{ objectFit: 'contain' }}
              />
            </Section>

            {/* HERO SECTION */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0">
              Olá, {firstName}! 👋
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Estamos muito felizes em ter você a bordo. Você acaba de dar o primeiro passo para <strong>zerar as faltas</strong> e otimizar o faturamento da sua clínica.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Seu plano atual é o <strong>FREE</strong>. Você tem <strong>10 envios gratuitos</strong> para testar a potência do nosso robô de encaixes.
            </Text>

            {/* CALL TO ACTION PRINCIPAL */}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-5 py-3"
                href={`${baseUrl}/dashboard`}
              >
                Acessar meu Dashboard
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            {/* SEÇÃO DE BENEFÍCIOS / MARKETING */}
            <Heading className="text-black text-[20px] font-bold text-center p-0 my-[20px] mx-0">
              Por que fazer o upgrade?
            </Heading>

            <Section>
              <Row>
                <Column>
                  <Img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    width="64"
                    height="64"
                    alt="Automático"
                    className="mx-auto mb-2"
                  />
                  <Text className="text-center font-bold text-sm">Automação Total</Text>
                  <Text className="text-center text-xs text-zinc-500 px-2">
                    O robô chama os pacientes sequencialmente sem você tocar em nada.
                  </Text>
                </Column>
                <Column>
                  <Img
                    src="https://cdn-icons-png.flaticon.com/512/2620/2620594.png"
                    width="64"
                    height="64"
                    alt="WhatsApp"
                    className="mx-auto mb-2"
                  />
                  <Text className="text-center font-bold text-sm">WhatsApp Próprio</Text>
                  <Text className="text-center text-xs text-zinc-500 px-2">
                    Conecte o número da sua clínica para maior confiança.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="mt-8 text-center bg-zinc-50 p-4 rounded-lg border border-zinc-100">
               <Text className="font-bold text-lg mb-2">Desbloqueie todo o potencial</Text>
               <Text className="text-sm mb-4">Planos a partir de R$ 97/mês.</Text>
               <Link href={`${baseUrl}/dashboard/settings/billing`} className="text-brand font-bold underline">
                  Ver Planos Disponíveis
               </Link>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            {/* FOOTER */}
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              Encaixe Já - Automação de Listas de Espera.
              <br />
              Se tiver dúvidas, responda a este email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};