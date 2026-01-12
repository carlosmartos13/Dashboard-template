import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      twoFactorEnabled: boolean
      isTwoFactorPending?: boolean
      twoFactorMethods?: string[] // <--- MUDOU DE string PARA string[]
      role?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    twoFactorEnabled: boolean
    isTwoFactorPending?: boolean
    twoFactorMethods?: string[] // <--- MUDOU
    role?: string

    // Mapeando os campos do banco para o objeto User interno se necessário
    twoFactorAppEnabled?: boolean
    twoFactorEmailEnabled?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    twoFactorEnabled: boolean
    isTwoFactorPending?: boolean
    twoFactorMethods?: string[] // <--- MUDOU
    role?: string
  }
}
