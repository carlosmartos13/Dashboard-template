import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

// ROTA POST: Realiza a autenticação e salva o token
export async function POST() {
  try {
    // 1. Buscar as credenciais salvas no banco
    const config = await prisma.pdvIntegration.findFirst()

    if (!config) {
      return NextResponse.json(
        { message: 'Nenhuma configuração encontrada. Configure as credenciais primeiro.' },
        { status: 404 }
      )
    }

    // 2. Preparar os dados
    const params = new URLSearchParams()
    params.append('username', config.username)
    params.append('password', config.password)
    params.append('grant_type', 'password')
    params.append('client_id', config.clientId)
    params.append('client_secret', config.clientSecret)

    // 3. Chamar a API da TabletCloud
    const response = await fetch('https://api.tabletcloud.com.br/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    const data = await response.json()

    if (!response.ok) {
      // Se a API externa retornou erro, lançamos para cair no catch
      throw new Error(data.error_description || 'Erro ao autenticar na API externa.')
    }

    // 4. Salvar o Token no banco de dados
    await prisma.pdvIntegration.update({
      where: { id: config.id },
      data: {
        accessToken: data.access_token
      }
    })

    return NextResponse.json({ success: true, token: data.access_token }, { status: 200 })
  } catch (error: any) {
    // CORREÇÃO AQUI: Se o seu tsconfig for estrito, mude para "catch (error)" e use a linha abaixo:
    // const err = error as any;

    // OBS: Se você removeu o ": any" do cabeçalho do catch e ainda der erro de "unknown", use assim:
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    console.error('Erro na autenticação:', error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

// ROTA GET: Verifica se existe um token salvo (para exibir o status "Conectado")
export async function GET() {
  try {
    const config = await prisma.pdvIntegration.findFirst()
    // Consideramos conectado se existir configuração E existir um accessToken preenchido
    const isConnected = !!(config && config.accessToken)

    return NextResponse.json({ isConnected }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ isConnected: false }, { status: 500 })
  }
}
