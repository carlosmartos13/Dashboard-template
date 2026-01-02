// test-email.ts
import dotenv from 'dotenv'
// Carrega as variáveis do .env para o script funcionar
dotenv.config()

import { sendEmail, verifyEmailConnection } from './src/libs/email'

async function main() {
  console.log('Testando conexão...')

  // 1. Verifica se a senha/login estão certos
  const isConnected = await verifyEmailConnection()
  if (!isConnected) return

  console.log('Tentando enviar email...')

  // 2. Tenta enviar um email de teste para você mesmo
  // MUDE O EMAIL ABAIXO PARA O SEU EMAIL REAL QUE VAI RECEBER O TESTE
  await sendEmail({
    to: 'carlosmartos04@gmail.com',
    subject: 'Teste de Envio - Admin Panel',
    html: `
      <div style="font-family: Arial; color: #333;">
        <h1>Olá, Admin! 🚀</h1>
        <p>Se você está lendo isso, o sistema de emails está funcionando perfeitamente.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">Enviado via Nodemailer</p>
      </div>
    `
  })
}

main()
