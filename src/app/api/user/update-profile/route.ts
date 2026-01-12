// src/app/api/user/update-profile/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import { authOptions } from '@/libs/auth'

// --- FUNÇÃO DE LEITURA (GET) ---
// Usada quando a página carrega para buscar a foto HD e o nome atualizado
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        image: true, // Retorna a imagem Base64 completa
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json({ message: 'Er ro interno' }, { status: 500 })
  }
}

// --- FUNÇÃO DE ATUALIZAÇÃO (PUT) ---
// Usada quando o frontend salva as alterações (Auto-save)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, image } = body

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name,
        // Só atualiza a imagem se ela vier preenchida (não nula/undefined)
        ...(image ? { image: image } : {})
      }
    })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso!',
      user: updatedUser
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ message: 'Erro interno ao salvar.' }, { status: 500 })
  }
}
