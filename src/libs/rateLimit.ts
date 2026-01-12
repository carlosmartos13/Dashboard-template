import prisma from '@/libs/db'

/**
 * Verifica se o usuário excedeu o limite de tentativas.
 * @param key Identificador único (ex: `2fa:${email}`)
 * @param limit Número máximo de tentativas permitidas
 * @param windowSeconds Tempo da janela em segundos (ex: 600 = 10 min)
 * @returns true se permitido, false se bloqueado
 */
export async function checkRateLimit(key: string, limit: number = 3, windowSeconds: number = 600) {
  const now = new Date()

  // 1. Busca o registro atual
  const record = await prisma.rateLimit.findUnique({
    where: { key }
  })

  // 2. Se não existe ou já expirou a janela de tempo, reseta/cria
  if (!record || record.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000)

    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt }
    })

    return true // Permitido (primeira tentativa da nova janela)
  }

  // 3. Se existe e está dentro do tempo, verifica o limite
  if (record.count >= limit) {
    return false // BLOQUEADO: Excedeu o limite
  }

  // 4. Se ainda tem tentativas sobrando, incrementa
  await prisma.rateLimit.update({
    where: { key },
    data: { count: record.count + 1 }
  })

  return true // Permitido
}

/**
 * Limpa o rate limit (usado quando o usuário acerta o código)
 */
export async function clearRateLimit(key: string) {
  try {
    await prisma.rateLimit.delete({
      where: { key }
    })
  } catch (error) {
    // Ignora erro se registro não existir
  }
}
