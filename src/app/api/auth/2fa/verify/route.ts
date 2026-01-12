import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import speakeasy from 'speakeasy'
import crypto from 'crypto'
import { authOptions } from '@/libs/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const { token } = await req.json()

    // Remove espaços em branco caso venha "123 456"
    const cleanToken = token.replace(/\s/g, '')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ message: 'Configuração de 2FA não iniciada.' }, { status: 400 })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: cleanToken,
      window: 2 // Importante: Aceita pequena diferença de relógio (+/- 60s)
    })

    if (verified) {
      // --- GERAR OU MANTER BACKUP CODES ---
      // Se o usuário já tiver códigos (ex: ativou por Email antes), nós mantemos os mesmos.
      // Se não tiver, geramos novos.
      let backupCodes: string[] = []

      if (user.twoFactorBackupCodes) {
        try {
          // Tenta ler os códigos existentes do banco
          backupCodes = JSON.parse(user.twoFactorBackupCodes)
        } catch (e) {
          // Se der erro (formato antigo), ignora e gera novos abaixo
          backupCodes = []
        }
      }

      // Se a lista estiver vazia, gera 10 novos códigos
      if (backupCodes.length === 0) {
        backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase())
      }

      // Salva no banco com a nova estrutura
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          twoFactorEnabled: true, // Master Switch ON
          twoFactorAppEnabled: true, // <--- CORREÇÃO: Ativa flag específica do App
          twoFactorBackupCodes: JSON.stringify(backupCodes) // Salva como JSON string
          // twoFactorMethod: REMOVIDO
        }
      })

      // Retorna os códigos para o frontend mostrar ao usuário
      return NextResponse.json({
        message: '2FA Ativado com sucesso!',
        backupCodes: backupCodes
      })
    } else {
      return NextResponse.json({ message: 'Código inválido.' }, { status: 400 })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
