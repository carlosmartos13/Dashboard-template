import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,

  // --- ADICIONE ESTA LINHA ---
  // Isso diz ao Next.js: "Não tente empacotar o Prisma ou o driver PG,
  // deixe-os rodar como arquivos nativos do Node.js".
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
  // ---------------------------

  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/pt_BR/dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(pt_BR|en)',
        destination: '/:lang//dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        source: '/:path((?!|pt_BR|en|front-pages|images|api|favicon.ico).*)*',
        destination: '/pt_BR/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
