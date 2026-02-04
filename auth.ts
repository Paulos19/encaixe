import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

// Função auxiliar para buscar usuário no banco
async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await getUser(email);
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password || '');
          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    // 1. Ocorre na criação/atualização do Token JWT
    async jwt({ token, user }) {
      if (user) {
        // "user" só existe no primeiro login. Persistimos os dados no token.
        token.sub = user.id; // Garante que o ID do banco vá para o token
        
        // Se quiser passar a role via sessão também (opcional, mas útil)
        // @ts-ignore - O TS pode reclamar se não tipar o User corretamente, mas funciona
        token.role = user.role; 
      }
      return token;
    },
    // 2. Ocorre quando o front-end pede a sessão (useSession, auth())
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub; // INJETANDO O ID NA SESSÃO
      }
      if (token.role && session.user) {
        // @ts-ignore
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});