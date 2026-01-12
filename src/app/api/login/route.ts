// src/app/api/login/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import bcrypt from 'bcryptjs' // Importamos a biblioteca

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    // 1. Valida se os dados chegaram
    if (!email || !password) {
      return NextResponse.json({ message: 'Por favor, informe email e senha.' }, { status: 400 })
    }

    // 2. Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    // 3. Se usuário não existe ou não tem senha cadastrada (login social), nega.
    if (!user || !user.password) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 })
    }

    // 4. A MÁGICA: Compara a senha digitada com o hash criptografado do banco
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 })
    }

    // 5. Remove a senha hash antes de devolver os dados (Segurança)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: passwordHash, ...userData } = user

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Erro de Login:', error)
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 })
  }
}
