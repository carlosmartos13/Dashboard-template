// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import crypto from 'crypto'
import { sendEmail } from '@/libs/email'
import { getResetPasswordHtml } from '@/libs/email-reset'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    // 1. Verifica se usuário existe
    const user = await prisma.user.findUnique({ where: { email } })

    // Por segurança, não avisamos se o email não existe (para evitar "chute" de emails)
    if (!user) {
      return NextResponse.json({ message: 'Se o email existir, enviamos as instruções.' })
    }

    // Se for conta Google (sem senha), bloqueia e avisa
    if (!user.password) {
      return NextResponse.json(
        { message: 'Esta conta usa login social (Google). Entre diretamente pelo botão do Google.' },
        { status: 400 }
      )
    }

    // 2. Gera Token e Validade (1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const passwordResetExpires = new Date(Date.now() + 3600000)

    // 3. Salva no Banco
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry: passwordResetExpires
      }
    })

    // 4. Gera o Link usando sua variável NEXT_PUBLIC_SERVER_HOST
    // Fallback para localhost caso a variável esteja vazia em dev
    const appUrl = process.env.NEXT_PUBLIC_SERVER_HOST || 'http://localhost:3000'

    // Removemos barra no final se houver (para garantir que a URL fique limpa)
    const cleanBaseUrl = appUrl.replace(/\/$/, '')

    // Monta a URL final apontando para a página visual (Frontend)
    // Ex: http://localhost:3000/pt_BR/reset-password?token=xyz
    const resetUrl = `${cleanBaseUrl}/pt_BR/reset-password?token=${resetToken}`

    // 5. Envia Email
    const html = getResetPasswordHtml(user.name || 'Usuário', resetUrl)

    await sendEmail({
      to: email,
      subject: 'Redefinição de Senha',
      html: html
    })

    return NextResponse.json({ message: 'Email enviado com sucesso!' })
  } catch (error) {
    console.error('Erro ForgotPassword:', error)
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 })
  }
}
