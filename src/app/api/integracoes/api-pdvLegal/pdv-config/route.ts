import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

// POST: Salva ou Atualiza (Código que já existia, mantive igual)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, client_id, client_secret } = body

    if (!username || !password || !client_id || !client_secret) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    // Verifica se já existe para atualizar (update) ou cria um novo (create)
    // Como não temos ID vindo do front, vamos buscar o primeiro.
    const existente = await prisma.pdvIntegration.findFirst()

    let result
    if (existente) {
      result = await prisma.pdvIntegration.update({
        where: { id: existente.id },
        data: { username, password, clientId: client_id, clientSecret: client_secret }
      })
    } else {
      result = await prisma.pdvIntegration.create({
        data: { username, password, clientId: client_id, clientSecret: client_secret }
      })
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno.' }, { status: 500 })
  }
}

// --- NOVO: GET para buscar os dados ---
export async function GET() {
  try {
    const config = await prisma.pdvIntegration.findFirst()

    if (!config) {
      return NextResponse.json({ empty: true }, { status: 200 })
    }

    return NextResponse.json({
      username: config.username,
      password: config.password,
      client_id: config.clientId,
      client_secret: config.clientSecret
    })
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar dados.' }, { status: 500 })
  }
}
