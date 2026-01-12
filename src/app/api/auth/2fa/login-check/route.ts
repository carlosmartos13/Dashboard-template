// ... imports mantidos ...
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import speakeasy from 'speakeasy'
import { authOptions } from '@/libs/auth'
import { checkRateLimit, clearRateLimit } from '@/libs/rateLimit'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ message: 'Erro de sessão' }, { status: 401 })
    const email = session.user.email

    // Rate Limit
    const rateLimitKey = `2fa:${email}`
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 600)
    if (!isAllowed) return NextResponse.json({ message: 'Muitas tentativas. Aguarde 10 min.' }, { status: 429 })

    const { token, method } = await req.json() // Recebe o método do frontend ('APP' ou 'EMAIL')
    const cleanToken = token.replace(/\s/g, '')

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.twoFactorEnabled) return NextResponse.json({ message: '2FA não configurado.' }, { status: 400 })

    let verified = false

    // --- NOVA LÓGICA DE VERIFICAÇÃO ---

    // 1. Verificar via APP
    if (method === 'APP' && user.twoFactorAppEnabled) {
      if (user.twoFactorSecret) {
        verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: cleanToken,
          window: 2
        })
      }
    }
    // 2. Verificar via EMAIL
    else if (method === 'EMAIL' && user.twoFactorEmailEnabled) {
      if (user.emailTwoFactorCode === cleanToken && user.emailTwoFactorExpires) {
        if (new Date() < user.emailTwoFactorExpires) {
          verified = true
          // Queima o código
          await prisma.user.update({
            where: { email },
            data: { emailTwoFactorCode: null }
          })
        }
      }
    }

    // 3. Fallback: Backup Codes
    if (!verified && user.twoFactorBackupCodes) {
      const codes = JSON.parse(user.twoFactorBackupCodes)
      if (codes.includes(cleanToken)) {
        verified = true
        const newCodes = codes.filter((c: string) => c !== cleanToken)
        await prisma.user.update({
          where: { email },
          data: { twoFactorBackupCodes: JSON.stringify(newCodes) }
        })
      }
    }

    if (!verified) return NextResponse.json({ message: 'Código incorreto ou expirado.' }, { status: 400 })

    await clearRateLimit(rateLimitKey)
    return NextResponse.json({ message: 'Sucesso', success: true })
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
