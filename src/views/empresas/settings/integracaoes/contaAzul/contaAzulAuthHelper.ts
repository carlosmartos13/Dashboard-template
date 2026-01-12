import prisma from '@/libs/db'

// Adicionamos o parâmetro opcional 'forceRefresh'
export async function getValidToken(empresaId: number, forceRefresh: boolean = false) {
  const config = await prisma.integracaoContaAzul.findUnique({
    where: { empresaId }
  })

  if (!config || !config.accessToken || !config.refreshToken) {
    throw new Error('Integração não configurada ou tokens ausentes.')
  }

  const now = new Date()
  const tokenDate = new Date(config.updatedAt)
  const expirationSeconds = config.expiresIn || 3600

  // Data exata que vence
  const expirationDate = new Date(tokenDate.getTime() + expirationSeconds * 1000)

  // Margem de segurança: 10 minutos (600.000 ms) antes de vencer, já consideramos vencido
  const isExpired = now.getTime() > expirationDate.getTime() - 600000

  // Se não foi forçado e não expirou, retorna o atual
  if (!forceRefresh && !isExpired) {
    return config.accessToken
  }

  console.log(`🔄 Renovando token da empresa ${empresaId} (Forçado: ${forceRefresh})...`)

  const cleanClientId = config.clientId.trim()
  const cleanClientSecret = config.clientSecret.trim()
  const basicAuth = Buffer.from(`${cleanClientId}:${cleanClientSecret}`).toString('base64')

  try {
    const response = await fetch('https://auth.contaazul.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao renovar token:', data)
      // Se der erro no refresh (ex: refresh token expirado), lançamos erro para o usuário logar de novo
      throw new Error('Sessão expirada. Faça login na Conta Azul novamente.')
    }

    // Salva os novos tokens no banco
    await prisma.integracaoContaAzul.update({
      where: { empresaId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      }
    })

    return data.access_token
  } catch (error) {
    console.error('Erro crítico na renovação:', error)
    throw error
  }
}
