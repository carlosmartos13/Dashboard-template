import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],

  typescript: {
    // Ignora erros de TypeScript no build (Resolve o erro do Prisma e do userData)
    ignoreBuildErrors: true
  },
  eslint: {
    // Ignora erros de lint
    ignoreDuringBuilds: true
  },
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
