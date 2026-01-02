// src/types/next-auth.d.ts
import { Role } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  // Estende a interface do Usuário que vem do banco
  interface User {
    role: Role
  }

  // Estende a Sessão que fica disponível no frontend
  interface Session {
    user: {
      role: Role
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  // Estende o Token JWT
  interface JWT {
    role: Role
  }
}
