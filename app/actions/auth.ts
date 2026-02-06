'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail, sendPasswordResetToken } from '@/lib/mail';

// --- SCHEMAS ---
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

// --- ACTIONS ---

// 1. Registro
export async function registerAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.message }; // Retorna erro de validação
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Este email já está cadastrado." };

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === process.env.EMAIL_ADMIN ? 'ADMIN' : 'MANAGER';

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        plan: 'FREE',
        messageLimit: 10,
        messagesSent: 0,
      },
    });

    // Envio de e-mail (não bloqueante)
    try {
      await sendWelcomeEmail(newUser.email, newUser.name || "Cliente");
    } catch (e) {
      console.error("Erro email boas vindas", e);
    }

    // Tenta logar automaticamente
    await signIn('credentials', { email, password, redirect: false });
    return { success: true };

  } catch (error) {
    if (error instanceof AuthError) return { error: "Conta criada, mas erro no login automático." };
    console.error("Erro Register:", error);
    return { error: "Erro ao criar conta no banco de dados." };
  }
}

// 2. Login
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

// 3. Esqueci a Senha (Gerar Token)
export async function forgotPasswordAction(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Se usuário não existe, retornamos sucesso falso por segurança
    if (!user) {
      return { success: true };
    }

    // CORREÇÃO: Usando Math.random para evitar erro de 'crypto' no Vercel/Edge
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(new Date().getTime() + 15 * 60 * 1000); // 15 min

    // Limpa tokens antigos e cria novo
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      }
    });

    // Envia o e-mail
    await sendPasswordResetToken(email, token);

    return { success: true };

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { error: "Erro ao enviar código. Tente novamente." };
  }
}

// 4. Verificar Código
export async function verifyResetCodeAction(email: string, token: string) {
  try {
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email, token }
    });

    if (!existingToken) {
      return { error: "Código inválido." };
    }

    if (new Date() > existingToken.expires) {
      return { error: "O código expirou. Solicite um novo." };
    }

    return { success: true };

  } catch (error) {
    console.error("Verify Code Error:", error);
    return { error: "Erro ao verificar código." };
  }
}

// 5. Redefinir Senha Final
export async function resetPasswordAction(email: string, token: string, newPassword: string) {
  try {
    // Validação do Token
    const verify = await verifyResetCodeAction(email, token);
    
    // CORREÇÃO TYPESCRIPT: Verifica se existe a propriedade 'error' antes de acessar
    if ("error" in verify) {
      return { error: verify.error };
    }

    if (newPassword.length < 8) return { error: "A senha deve ter no mínimo 8 caracteres." };

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza senha e limpa tokens
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    return { success: true };

  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: "Erro ao atualizar a senha." };
  }
}