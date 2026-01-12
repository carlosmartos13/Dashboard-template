import { NextResponse } from 'next/server'

import prisma from '@/libs/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // 1. Validações Iniciais
  if (!code || !state) {
    return NextResponse.json({ error: 'Código ou State inválido recebido da Conta Azul' }, { status: 400 })
  }

  const empresaId = parseInt(state)

  if (isNaN(empresaId)) {
    return NextResponse.json({ error: 'ID da empresa inválido no State' }, { status: 400 })
  }

  // 2. Busca Credenciais do .ENV
  const clientId = process.env.CONTA_AZUL_CLIENT_ID
  const clientSecret = process.env.CONTA_AZUL_CLIENT_SECRET
  const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST || process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !serverHost) {
    console.error('❌ ERRO CRÍTICO: Variáveis de ambiente faltando.')

    return NextResponse.json({ error: 'Erro de configuração no servidor (ENV)' }, { status: 500 })
  }

  // 3. Monta a Autenticação (BASIC AUTH - HEADER)
  // Nota: O .trim() é vital caso tenha copiado com espaços do site
  const credentials = `${clientId.trim()}:${clientSecret.trim()}`
  const basicAuth = Buffer.from(credentials).toString('base64')

  // A Redirect URI deve ser EXATAMENTE igual à enviada no passo 1
  const redirectUri = `${serverHost}/api/integracoes/api-contaAzul/ca-callback`

  try {
    console.log('🔄 Trocando Code por Token na URL auth.contaazul.com...')

    // 4. Troca o CODE pelo TOKEN (URL CORRETA AGORA)
    const tokenResponse = await fetch('https://auth.contaazul.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`, // Cabeçalho obrigatório conforme documentação
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      })
    })

    const tokenData = await tokenResponse.json()

    // Se der erro, loga o detalhe que veio da Conta Azul
    if (!tokenResponse.ok) {
      console.error('❌ Erro da Conta Azul:', tokenData)

      return NextResponse.json(
        {
          error: 'Falha na troca de token.',
          detalhes: tokenData
        },
        { status: 400 }
      )
    }

    // 5. Salva os Tokens no Banco (UPSERT)
    await prisma.integracaoContaAzul.upsert({
      where: { empresaId },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      },
      create: {
        empresaId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      }
    })

    console.log(`✅ Sucesso! Conexão realizada para empresa ${empresaId}`)

    // 6. Redireciona de volta para a tela de configurações com flag de sucesso
    return NextResponse.redirect(`${serverHost}/app/empresas/config?success=true`)
  } catch (error: any) {
    console.error('❌ Erro Fatal no Callback:', error)

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Erro: A Empresa informada não existe no banco de dados local.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Falha interna na autenticação OAuth' }, { status: 500 })
  }
}
