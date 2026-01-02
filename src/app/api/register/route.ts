// src/app/api/register/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json()

    // 1. Validação básica
    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Preencha todos os campos.' }, { status: 400 })
    }

    // 2. Verifica se o email já existe
    const userExists = await prisma.user.findUnique({
      where: { email }
    })

    if (userExists) {
      return NextResponse.json(
        { message: 'Este email já está cadastrado.' },
        { status: 409 } // Conflict
      )
    }

    // 3. Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Cria o usuário no banco
    // Nota: Definimos o role padrão como 'ATENDENTE' ou outro que você preferir
    const newUser = await prisma.user.create({
      data: {
        name: username,
        email: email,
        password: hashedPassword,
        role: 'ATENDENTE' // <--- Define o cargo padrão de quem se cadastra
      }
    })

    // Remove a senha do retorno por segurança
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPass } = newUser

    return NextResponse.json(userWithoutPass, { status: 201 })
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json({ message: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
