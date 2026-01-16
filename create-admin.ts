// create-admin.ts

import { Role } from './src/generated/prisma/enums'
import * as dotenv from 'dotenv'
import { PrismaClient } from './src/generated/prisma/client'
import { Pool } from 'pg' // Import Pool from 'pg'
import { PrismaPg } from '@prisma/adapter-pg' // Import PrismaPg adapter

// Ensure dotenv is configured early
dotenv.config()

// Create a new pg Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Instantiate the PrismaPg adapter
const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // Pass the adapter here
    log: ['query', 'info', 'warn', 'error']
  })

// Em vez de importar o 'prisma' da sua lib, vamos instanciar um novo aqui
// para garantir que ele use o binário local do container

import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

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

  console.log(`✅ Usuário Admin (${email}) verificado/criado com sucesso!`)
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
