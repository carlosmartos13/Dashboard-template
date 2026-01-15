// create-admin.ts
import { Role } from './node_modules/@prisma/client/index.js'
import { PrismaClient } from './node_modules/@prisma/client/index.js'

// Em vez de importar o 'prisma' da sua lib, vamos instanciar um novo aqui
// para garantir que ele use o binário local do container
const prisma = new PrismaClient()
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
