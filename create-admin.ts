// create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'suporte@seatec.com.br' // Seu email de login
  const senhaPlana = 'seatecsuporte' // Sua senha de login

  // Gera o hash seguro
  const passwordHash = await bcrypt.hash(senhaPlana, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash // Atualiza a senha se o usuário já existir
    },
    create: {
      email,
      name: 'Admin Master',
      password: passwordHash,
      image: '/images/avatars/1.png'
    }
  })

  console.log(`✅ Usuário criado/atualizado!`)
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Senha: ${senhaPlana}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
