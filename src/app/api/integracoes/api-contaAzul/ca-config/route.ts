import { NextResponse } from 'next/server'

import prisma from '@/libs/db'

export const dynamic = 'force-dynamic'

// GET: Verifica status da conexão
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaIdParam = searchParams.get('empresaId')
    const empresaId = empresaIdParam ? parseInt(empresaIdParam) : null

    // Validação inicial
    if (!empresaId || isNaN(empresaId)) {
      return NextResponse.json({ error: 'Faltando empresaId válido na URL' }, { status: 400 })
    }

    // Buscamos apenas se existe um token salvo para essa empresa
    const config = await prisma.integracaoContaAzul.findUnique({
      where: { empresaId },
      select: { accessToken: true }
    })

    // Se tiver accessToken, consideramos conectado
    const isConnected = !!config?.accessToken

    return NextResponse.json({
      isConnected

      // Não retornamos chaves sensíveis
    })
  } catch (error: any) {
    console.error('❌ Erro GET Status:', error)

    // MELHORIA: Retorna a mensagem técnica do erro (ex: falha de conexão com banco)
    // Isso permite que o Toast do frontend mostre o motivo real
    return NextResponse.json(
      {
        error: error.message || 'Erro desconhecido ao verificar status da conexão.'
      },
      { status: 500 }
    )
  }
}
