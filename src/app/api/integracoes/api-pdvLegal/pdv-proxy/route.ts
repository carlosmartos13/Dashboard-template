import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

// Base URL da API (Ajuste se necessário, baseando-se na URL do token anterior)
const BASE_URL = 'https://api.tabletcloud.com.br'

export async function POST(request: Request) {
  try {
    const { endpoint, integration } = await request.json()

    // 1. Verifica qual integração foi selecionada
    if (integration !== 'pdvlegal') {
      return NextResponse.json({ message: 'Integração não suportada ou não implementada.' }, { status: 400 })
    }

    // 2. Busca o token no Banco de Dados
    const config = await prisma.pdvIntegration.findFirst()

    if (!config || !config.accessToken) {
      return NextResponse.json(
        {
          message: 'Token de acesso não encontrado. Vá em Configurações e conecte a API primeiro.'
        },
        { status: 401 }
      )
    }

    // 3. Garante que o endpoint comece com /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    // 4. Faz a requisição para a API Externa usando o Token do banco
    console.log(`[Proxy] Chamando: ${BASE_URL}${cleanEndpoint}`)

    const apiResponse = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })

    // Tenta fazer o parse do JSON, se falhar pega o texto
    let data
    const contentType = apiResponse.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await apiResponse.json()
    } else {
      data = await apiResponse.text()
    }

    // Retorna o resultado para o frontend (mesmo que seja erro da API externa)
    return NextResponse.json(
      {
        status: apiResponse.status,
        data: data
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro no Proxy API:', error)
    return NextResponse.json(
      {
        message: 'Erro interno no servidor Next.js',
        details: error.message
      },
      { status: 500 }
    )
  }
}
