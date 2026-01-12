// update-role.ts
import prisma from '@/libs/db'

async function main() {
  const email = 'suporte@seatec.com.br' // Seu email

  const user = await prisma.user.update({
    where: { email },
    data: {
      role: Role.SUPER_ADMIN
    }
  })

  console.log(`✅ Usuário ${user.email} agora é: ${user.role}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
  })
