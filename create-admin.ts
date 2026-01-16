// create-admin.ts

import { Role } from './src/generated/prisma/enums'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'] // Optional: logs queries to the console
  })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
dotenv.config()

// Em vez de importar o 'prisma' da sua lib, vamos instanciar um novo aqui
// para garantir que ele use o binário local do container

import bcrypt from 'bcryptjs'

async function main() {
  const email = 'suporte@seatec.com.br'
  const senhaPlana = 'seatecsuporte'
  const passwordHash = await bcrypt.hash(senhaPlana, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: passwordHash },
    create: {
      email,
      name: 'Admin Master',
      password: passwordHash,
      image: '/images/avatars/1.png',
      role: Role.SUPER_ADMIN
    }
  })

  console.log(`✅ Usuário criado/atualizado!`)
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
