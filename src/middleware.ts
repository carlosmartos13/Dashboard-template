import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const path = req.nextUrl.pathname

  // Rota onde é feita a verificação do código 2FA
  const twoFactorVerificationUrl = '/pt_BR/pages/auth/two-steps-v1'

  // 1. Defina rotas PÚBLICAS
  const isPublic =
    path.includes('/login') ||
    path.includes('/register') ||
    path.includes('/forgot-password') ||
    path.includes('/reset-password') ||
    path.includes('/auth/verify-email') ||
    path.includes('/pages/misc/')

  // 2. Se for pública, libera
  if (isPublic) {
    return NextResponse.next()
  }

  // --- 3. BLOQUEIO DE 2FA PENDENTE ---
  // Se o usuário tem token, MAS está com 2FA pendente...
  // @ts-ignore
  if (token?.isTwoFactorPending) {
    // ... e ele NÃO está na página de verificação...
    if (!path.includes('/pages/auth/two-steps-v1')) {
      // ... força ele a ir para lá.
      return NextResponse.redirect(new URL(twoFactorVerificationUrl, req.url))
    }
    // Se ele já está na página de verificação, deixa ele passar para digitar o código.
    return NextResponse.next()
  }
  // -----------------------------------

  // 4. Se não tem token nenhum (e não é pública), a configuração abaixo já manda pro login.
  if (token) {
    return NextResponse.next()
  }

  // Lógica de i18n para quem não tem token (mantida da versão anterior)
  const pathSegments = path.split('/')
  let locale = pathSegments[1]
  const supportedLocales = ['pt_BR', 'en', 'fr']
  if (!supportedLocales.includes(locale)) locale = 'pt_BR'
  const loginUrl = new URL(`/${locale}/login`, req.url)
  loginUrl.searchParams.set('callbackUrl', path)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)']
}
