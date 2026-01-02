// src/libs/email.ts
import nodemailer from 'nodemailer'

// Cria o transportador (o carteiro)
// Ele vai ler as configurações do seu arquivo .env
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

// Função auxiliar para verificar se a conexão está OK (opcional, mas bom para debug)
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify()
    console.log('✅ Servidor de Email pronto para enviar mensagens')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão com servidor de email:', error)
    return false
  }
}

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export const sendEmail = async (data: EmailPayload) => {
  const emailFrom = process.env.EMAIL_FROM || 'Admin <noreply@example.com>'

  try {
    await transporter.sendMail({
      from: emailFrom, // Quem manda (configurado no .env)
      to: data.to, // Quem recebe
      subject: data.subject, // Assunto
      html: data.html // Conteúdo (pode ser HTML bonito)
    })
    console.log(`📧 Email enviado com sucesso para: ${data.to}`)
    return true
  } catch (error) {
    console.error('❌ Falha ao enviar email:', error)
    return false
  }
}
