// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/libs/db'
import { compare } from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'

// --- 1. NOVOS IMPORTS AQUI ---
import { generateTwoFactorToken } from '@/libs/mail-tokens'
import { sendTwoFactorTokenEmail } from '@/libs/email'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        // --- 2. ADICIONEI twoFactorCode AQUI ---
        const { email, password, twoFactorCode } = credentials as {
          email: string
          password: string
          twoFactorCode?: string // Pode vir ou não
        }

        try {
          // ---------------------------------------------------------
          // 1. BUSCA O USUÁRIO
          // ---------------------------------------------------------
          const user = await prisma.user.findUnique({
            where: { email: email }
          })

          if (!user) {
            console.log('❌ Usuário não encontrado:', email)
            return null
          }

          // ---------------------------------------------------------
          // 2. VALIDA A SENHA
          // ---------------------------------------------------------
          if (!user.password) {
            console.log('❌ Usuário sem senha (provavelmente OAuth)')
            return null
          }

          const isPasswordValid = await compare(password, user.password)

          if (!isPasswordValid) {
            console.log('❌ Senha incorreta para:', email)
            return null
          }

          // ---------------------------------------------------------
          // 3. LÓGICA DE 2FA (ATUALIZADA)
          // ---------------------------------------------------------
          const is2faEnabled = user.twoFactorEnabled || false

          // Se 2FA estiver ativo, precisamos tratar
          if (is2faEnabled) {
            // CENÁRIO A: É a primeira tentativa (usuário digitou senha, mas não o código)
            if (!twoFactorCode) {
              console.log('🔒 2FA Ativo. Gerando token...')

              // A.1 Gera o token no banco
              if (!user.email) {
                throw new Error('Email is required for 2FA')
              }
              const tokenGerado = await generateTwoFactorToken(user.email)

              // A.2 Envia o email (e mostra no console do VS Code)
              await sendTwoFactorTokenEmail(tokenGerado.email, tokenGerado.token)

              // A.3 INTERROMPE O LOGIN!
              // Lança um erro específico que o Frontend vai capturar para mostrar o campo de código
              throw new Error('2fa_required')
            }

            // CENÁRIO B: Usuário já enviou o código (Validaremos isso logo mais)
            console.log('📝 Código 2FA recebido para validação:', twoFactorCode)

            // ... (Aqui entrará a validação do token no próximo passo) ...
          }

          // --- FIM DA LÓGICA 2FA ---

          const methods: string[] = []
          if (is2faEnabled) {
            if (user.twoFactorAppEnabled) methods.push('APP')
            if (user.twoFactorEmailEnabled) methods.push('EMAIL')
          }
          if (is2faEnabled && methods.length === 0) methods.push('APP')

          console.log('✅ Login Autorizado!')

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            twoFactorEnabled: is2faEnabled,
            isTwoFactorPending: is2faEnabled,
            twoFactorMethods: methods
          }
        } catch (e: any) {
          // Log importante para debug
          console.log('Status do Authorize:', e.message)
          throw new Error(e.message)
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id
        if (account?.provider === 'google') {
          if (user.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: {
                twoFactorEnabled: true,
                twoFactorAppEnabled: true,
                twoFactorEmailEnabled: true
              }
            })
            const isEnabled = dbUser?.twoFactorEnabled || false
            const methods: string[] = []
            if (isEnabled) {
              if (dbUser?.twoFactorAppEnabled) methods.push('APP')
              if (dbUser?.twoFactorEmailEnabled) methods.push('EMAIL')
            }
            if (isEnabled && methods.length === 0) methods.push('APP')

            token.twoFactorEnabled = isEnabled
            token.isTwoFactorPending = isEnabled
            token.twoFactorMethods = methods
          }
        } else {
          token.twoFactorEnabled = user.twoFactorEnabled
          token.isTwoFactorPending = user.isTwoFactorPending
          token.twoFactorMethods = user.twoFactorMethods
        }
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session.user }
        if (session.isTwoFactorVerified === true) {
          token.isTwoFactorPending = false
        }
        if (typeof session.twoFactorEnabled === 'boolean') {
          token.twoFactorEnabled = session.twoFactorEnabled
        }
        if (session.twoFactorMethods) {
          token.twoFactorMethods = session.twoFactorMethods
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.isTwoFactorPending = token.isTwoFactorPending as boolean
        session.user.twoFactorMethods = (token.twoFactorMethods as string[]) || []
      }
      return session
    }
  }
}
