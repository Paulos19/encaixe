import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  // Extende a interface User padrão (usada no authorize)
  interface User {
    role?: string
  }

  // Extende a Sessão para incluir o ID e a Role
  interface Session {
    user: {
      id: string // <--- Obrigatório para corrigir o erro da Silvia
      role?: string
    } & DefaultSession["user"]
  }
}

// Extende o Token JWT para carregar a role
declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}