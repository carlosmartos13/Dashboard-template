// src/app/api/user/change-password/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/libs/auth'

export async function PUT(req: Request) {
  try {
    // 1. Verifica sessão
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json()

    // 2. Validações básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'Preencha todos os campos.' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'As senhas não conferem.' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    // 3. Busca usuário no banco (precisamos da senha hashada atual)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Usuário não encontrado ou logado via Google.' }, { status: 404 })
    }

    // 4. Verifica se a senha ATUAL está correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'A senha atual está incorreta.' }, { status: 400 })
    }

    // 5. Criptografa e Salva a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Senha alterada com sucesso!' })
  } catch (error) {
    console.error('Erro ao mudar senha:', error)
    return NextResponse.json({ message: 'Erro interno.' }, { status: 500 })
  }
}
