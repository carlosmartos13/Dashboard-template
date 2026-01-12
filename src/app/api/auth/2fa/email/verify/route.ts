import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ message: 'Token obrigatório' }, { status: 400 })
    }

    // 1. Busca o token no banco para este usuário
    const storedToken = await prisma.twoFactorToken.findFirst({
      where: {
        email: session.user.email,
        token: token
      }
    })

    if (!storedToken) {
      return NextResponse.json({ message: 'Código inválido ou inexistente' }, { status: 400 })
    }

    // 2. Verifica se expirou
    const hasExpired = new Date(storedToken.expires) < new Date()
    if (hasExpired) {
      // Limpa token velho
      await prisma.twoFactorToken.delete({ where: { id: storedToken.id } })
      return NextResponse.json({ message: 'Código expirado' }, { status: 400 })
    }

    // 3. SUCESSO! Ativa o 2FA no usuário
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorEnabled: true, // Ativa o global
        twoFactorEmailEnabled: true, // Ativa o método email
        twoFactorAppEnabled: false // (Opcional) Desativa App se quiser forçar só 1
      }
    })

    // 4. Limpa o token usado
    await prisma.twoFactorToken.delete({ where: { id: storedToken.id } })

    return NextResponse.json({ message: 'Email vinculado com sucesso!' })
  } catch (error: any) {
    console.error('Erro ao verificar token:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
