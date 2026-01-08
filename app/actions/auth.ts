'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/mail'; // Certifique-se que este arquivo existe

// 1. Schema Robusto
const RegisterSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Pelo menos um caractere especial"),
});

// 2. Action de Registro
export async function registerAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.message };
  }

  const { name, email, password } = validatedFields.data;

  // Verifica se usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Este email já está cadastrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Lógica de Admin Automático
  const role = email === process.env.EMAIL_ADMIN ? 'ADMIN' : 'MANAGER';

  try {
    // 1. Criar Usuário no Banco
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        plan: 'FREE',
        messageLimit: 10,
        messagesSent: 0,
      },
    });

    // 2. Enviar Email de Boas-Vindas (Assíncrono)
    // Usamos await para garantir o envio antes de redirecionar, mas em produção com alto volume
    // seria ideal jogar numa fila (Redis/Bull). Para MVP, await está ótimo.
    try {
        await sendWelcomeEmail(newUser.email, newUser.name || "Cliente");
    } catch (emailError) {
        console.error("⚠️ Falha ao enviar email de boas-vindas:", emailError);
        // Não falhamos o registro se o email falhar
    }

  } catch (error) {
    console.error("Erro Register DB:", error);
    return { error: "Erro ao criar usuário no banco de dados." };
  }

  // 3. Login Automático
  try {
    await signIn('credentials', {
        email,
        password,
        redirect: false, 
    });
    
    return { success: true };

  } catch (error) {
     if (error instanceof AuthError) {
       return { error: "Conta criada, mas erro ao realizar login automático." };
    }
    throw error;
  }
}

// 3. Action de Login
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciais inválidas.';
        default:
          return 'Algo deu errado. Tente novamente.';
      }
    }
    throw error;
  }
}