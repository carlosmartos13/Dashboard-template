import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    // 1. Gera um segredo único
    const secret = speakeasy.generateSecret({
      name: `Admin Panel (${session.user.email})` // O nome que aparece no App do celular
    })

    // 2. Salva o segredo no banco (mas ainda NÃO habilita o 2FA até confirmar)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { twoFactorSecret: secret.base32 }
    })

    // 3. Gera a imagem do QR Code em Base64
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

    return NextResponse.json({ qrCodeUrl })
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}
