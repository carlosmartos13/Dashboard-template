// src/libs/mail-tokens.ts
import crypto from 'crypto'
import prisma from '@/libs/db' // Importando do seu singleton v7

export const generateTwoFactorToken = async (email: string) => {
  // 1. Gera um código numérico de 6 dígitos (ex: "482910")
  const token = crypto.randomInt(100_000, 1_000_000).toString()

  // 2. Expira em 5 minutos
  // new Date().getTime() pega milissegundos atuais + (5 min * 60 seg * 1000 ms)
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000)

  // 3. Remove tokens antigos desse email para não acumular lixo
  const existingToken = await prisma.twoFactorToken.findFirst({
    where: { email }
  })

  if (existingToken) {
    await prisma.twoFactorToken.delete({
      where: { id: existingToken.id }
    })
  }

  // 4. Cria o novo token
  const twoFactorToken = await prisma.twoFactorToken.create({
    data: {
      email,
      token,
      expires
    }
  })

  return twoFactorToken
}
