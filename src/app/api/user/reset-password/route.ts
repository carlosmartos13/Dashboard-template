// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
    }

    // 1. Busca usuário pelo token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token ainda não expirou
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Link inválido ou expirado. Solicite novamente.' }, { status: 400 })
    }

    // 2. Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 3. Atualiza a senha e LIMPA o token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // Limpa para não usar o mesmo link 2x
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({ message: 'Senha alterada com sucesso!' })
  } catch (error) {
    console.error('Erro ResetPassword:', error)
    return NextResponse.json({ message: 'Erro interno.' }, { status: 500 })
  }
}
