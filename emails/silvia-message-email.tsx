import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface SilviaMessageEmailProps {
  content: string; // O texto/HTML que a Silvia mandou
  subject: string;
}

export const SilviaMessageEmail = ({
  content,
  subject,
}: SilviaMessageEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
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
        <Body className="bg-zinc-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white shadow-sm">
            {/* LOGO */}
            <Section className="mt-[20px]">
              <Img
                src="https://bzbrxkmhdxvh0b4p.public.blob.vercel-storage.com/Gemini_Generated_Image_jnme2zjnme2zjnme.png"
                width="64"
                height="64"
                alt="Encaixe Já"
                className="my-0 mx-auto rounded-xl object-cover"
              />
            </Section>

            {/* TÍTULO (Assunto) */}
            <Heading className="text-zinc-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
              {subject}
            </Heading>

            {/* CONTEÚDO DA SILVIA */}
            {/* Usamos dangerouslySetInnerHTML para permitir negrito <b> e quebras <br> que a IA mandar */}
            <Section className="text-zinc-700 text-[14px] leading-[24px]">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </Section>

            {/* ASSINATURA AUTOMÁTICA */}
            <Text className="text-zinc-700 text-[14px] leading-[24px] mt-[20px]">
              Atenciosamente,<br />
              <strong>Equipe Encaixe Já</strong>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              © {new Date().getFullYear()} Encaixe Já.<br />
              Esta mensagem foi enviada automaticamente através da nossa assistente virtual.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SilviaMessageEmail;