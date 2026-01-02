'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';

const RegisterSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function register(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Campos inválidos" };
  }

  const { name, email, password } = validatedFields.data;

  // Verifica se usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email já cadastrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // LÓGICA DE ADMIN AUTOMÁTICO
  // Se o email bater com o do .env, vira ADMIN, senão é MANAGER (dono da clínica)
  const role = email === process.env.EMAIL_ADMIN ? 'ADMIN' : 'MANAGER';

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
      },
    });
  } catch (error) {
    return { error: "Erro ao criar usuário no banco de dados." };
  }

  // Loga o usuário automaticamente após registro
  try {
    await signIn('credentials', {
        email,
        password,
        redirectTo: role === 'ADMIN' ? '/admin' : '/dashboard'
    });
  } catch (error) {
     if (error instanceof AuthError) {
      return { error: "Erro ao realizar login automático." };
    }
    throw error;
  }
}

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