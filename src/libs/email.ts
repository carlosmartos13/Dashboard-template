// src/libs/mail.ts
import nodemailer from 'nodemailer'

// 1. Cria o transportador (o carteiro)
// Ele vai ler as configurações do seu arquivo .env
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Geralmente false para porta 587, true para 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

// 2. Função auxiliar para verificar se a conexão está OK (opcional, mas bom para debug)
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

// 3. Função Genérica de Envio (usada por outras partes do sistema também)
export const sendEmail = async (data: EmailPayload) => {
  const emailFrom = process.env.EMAIL_FROM || 'Admin <noreply@exemplo.com>'

  try {
    await transporter.sendMail({
      from: emailFrom, // Quem manda
      to: data.to, // Quem recebe
      subject: data.subject,
      html: data.html
    })
    console.log(`📧 Email enviado com sucesso para: ${data.to}`)
    return true
  } catch (error) {
    console.error('❌ Falha ao enviar email:', error)
    return false
  }
}

// 4. Função Específica para Enviar o Token 2FA
export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  // A. BACKUP DE SEGURANÇA (Console Log)
  // Isso garante que você veja o código mesmo se o SMTP falhar ou estiver em localhost
  console.log('=============================================')
  console.log('🔐 CÓDIGO 2FA GERADO (Console Backup)')
  console.log(`📧 Para: ${email}`)
  console.log(`🔢 Código: ${token}`)
  console.log('=============================================')

  // B. Template HTML Simples e Bonito
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #666CFF; text-align: center;">Código de Verificação</h2>
      <p style="text-align: center; font-size: 16px;">Você solicitou login no Dashboard.</p>
      <p style="text-align: center; font-size: 16px;">Use o código abaixo para completar seu acesso:</p>

      <div style="background: #f4f5fa; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; border-radius: 8px; margin: 30px 0; color: #333;">
        ${token}
      </div>

      <p style="text-align: center; font-size: 14px; color: #999;">Este código expira em 5 minutos.</p>
      <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">Se você não solicitou este código, ignore este e-mail.</p>
    </div>
  `

  // C. Dispara o e-mail real
  await sendEmail({
    to: email,
    subject: 'Seu Código de Acesso 2FA',
    html: htmlContent
  })
}
