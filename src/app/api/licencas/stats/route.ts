import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Contagem Geral
    const [totalAtivas, totalInativas] = await Promise.all([
      // ATIVOS: Filtra excluindo Delivery e Certificado
      prisma.pdvLicencaFilial.count({
        where: {
          ativo: true,
          grupo: {
            produto: {
              notIn: ['DELIVERY LEGAL', 'CERTIFICADO DIGITAL']
            }
          }
        }
      }),
      // INATIVOS: Mantém contagem geral (ou aplique o filtro aqui se desejar)
      prisma.pdvLicencaFilial.count({ where: { ativo: false } })
    ])

    // 2. Dados do PDVLEGAL (Traz tudo para o detalhamento)
    const rawPdvData = await prisma.pdvLicencaFilial.findMany({
      where: { sistema: 'PDVLEGAL' },
      select: {
        ativo: true,
        grupo: { select: { produto: true } }
      }
    })

    const totalPdvLegal = rawPdvData.length

    // 3. Agrupamento por Produto
    const productStats: Record<string, { ativos: number; inativos: number }> = {}

    rawPdvData.forEach(item => {
      let produtoName = item.grupo?.produto || 'OUTROS'

      // Normalização de nomes para exibição
      if (produtoName === 'GESTAO LEGAL') produtoName = 'Gestão'
      if (produtoName === 'DELIVERY LEGAL') produtoName = 'Delivery'
      if (produtoName === 'CERTIFICADO DIGITAL') produtoName = 'Cert. Digital'

      if (!productStats[produtoName]) {
        productStats[produtoName] = { ativos: 0, inativos: 0 }
      }

      if (item.ativo) productStats[produtoName].ativos++
      else productStats[produtoName].inativos++
    })

    const details = Object.entries(productStats)
      .map(([name, counts]) => ({
        name,
        active: counts.ativos,
        inactive: counts.inativos
      }))
      .sort((a, b) => b.active - a.active)

    return NextResponse.json({
      ativas: totalAtivas,
      inativas: totalInativas,
      pdvLegal: {
        total: totalPdvLegal,
        details: details
      }
    })
  } catch (error) {
    console.error('Erro stats:', error)
    return NextResponse.json({ message: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
