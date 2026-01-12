import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import speakeasy from 'speakeasy'
import { authOptions } from '@/libs/auth'
// 1. Importar o Rate Limit
import { checkRateLimit, clearRateLimit } from '@/libs/rateLimit'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const email = session.user.email

    // --- 2. BLOQUEIO (RATE LIMIT) ---
    // Usamos a mesma chave. Se ele errar muito no login, também bloqueia aqui.
    const rateLimitKey = `2fa:${email}`
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 600)

    if (!isAllowed) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Aguarde 10 minutos para tentar novamente.' },
        { status: 429 }
      )
    }
    // --------------------------------

    const { token } = await req.json()
    const cleanToken = token.replace(/\s/g, '')

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ message: '2FA já está desativado.' }, { status: 400 })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: cleanToken,
      window: 2
    })

    if (!verified) {
      // Sua mensagem personalizada aqui!
      return NextResponse.json(
        {
          message: 'Código incorreto ou data e hora do dispositivo estão errados.'
        },
        { status: 400 }
      )
    }

    // --- 3. SUCESSO: LIMPAR CONTADOR ---
    await clearRateLimit(rateLimitKey)
    // -----------------------------------

    await prisma.user.update({
      where: { email },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    })

    return NextResponse.json({ message: '2FA Desativado com sucesso!' })
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
