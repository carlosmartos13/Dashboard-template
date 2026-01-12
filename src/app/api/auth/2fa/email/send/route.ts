import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/db'
import { authOptions } from '@/libs/auth'
import { checkRateLimit } from '@/libs/rateLimit' // Sua função de Rate Limit

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const email = session.user.email

    // 1. Rate Limit de ENVIO (Evitar Spam de Email)
    // Regra: 1 envio a cada 60 segundos
    const limitKey = `email_send:${email}`
    const canSend = await checkRateLimit(limitKey, 1, 60) // Limite de 1 tentativa em 60s

    if (!canSend) {
      return NextResponse.json({ message: 'Aguarde 1 minuto para reenviar.' }, { status: 429 })
    }

    // 2. Gerar Código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos de validade

    // 3. Salvar no Banco
    await prisma.user.update({
      where: { email },
      data: {
        emailTwoFactorCode: code,
        emailTwoFactorExpires: expires
      }
    })

    // 4. ENVIAR O EMAIL (AQUI VOCÊ CONECTA SEU SERVIÇO REAL)
    console.log('📧 [SIMULAÇÃO] Enviando email para:', email)
    console.log('🔑 [SIMULAÇÃO] Código:', code)

    // TODO: Implementar envio real (Ex: Nodemailer, Resend, AWS SES)
    // await sendEmail({ to: email, subject: 'Seu código de verificação', text: code })

    return NextResponse.json({ message: 'Código enviado com sucesso' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}
