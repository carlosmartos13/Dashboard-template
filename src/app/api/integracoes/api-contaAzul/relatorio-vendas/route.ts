import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresaId')
  const dateParam = searchParams.get('date') // Recebemos a data do filtro

  if (!empresaId) return NextResponse.json({ error: 'Faltando empresaId' }, { status: 400 })

  try {
    // 1. Define o intervalo do mês selecionado
    // Se não vier data (primeiro load), assume hoje.
    const baseDate = dateParam ? new Date(dateParam) : new Date()

    // Primeiro dia do mês (00:00:00)
    const primeiroDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)

    // Último dia do mês (23:59:59)
    const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
    ultimoDia.setHours(23, 59, 59, 999)

    // 2. Busca no Banco FILTRANDO pela data de vencimento
    const vendas = await prisma.contaAzulRecebimento.findMany({
      where: {
        empresaId: Number(empresaId),

        // AQUI ESTÁ O FILTRO QUE FALTAVA:
        data_vencimento: {
          gte: primeiroDia, // Maior ou igual ao dia 1
          lte: ultimoDia // Menor ou igual ao dia 30/31
        }
      },
      include: {
        cliente: true // Traz dados do cliente (Nome, Doc, Tel)
      },
      orderBy: {
        data_vencimento: 'asc' // Ordena do dia 1 ao dia 30 (mais lógico para tabela)
      }
    })

    return NextResponse.json({ data: vendas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
