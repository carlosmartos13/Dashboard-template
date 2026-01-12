import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresaId')
  const dateParam = searchParams.get('date') // Recebe a data do filtro

  if (!empresaId) return NextResponse.json({ error: 'Faltando empresaId' }, { status: 400 })

  try {
    // 1. Definição das datas (Mês Selecionado)
    // Se vier data na URL, usa ela. Se não, usa hoje.
    const baseDate = dateParam ? new Date(dateParam) : new Date()

    // Primeiro dia do mês selecionado
    const primeiroDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    // Último dia do mês selecionado
    const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)

    // 2. Busca no Banco
    // Buscamos TUDO da empresa, sem filtrar data no banco.
    // Motivo: Precisamos calcular o "Atrasado Geral" (histórico antigo) e não só o atrasado deste mês.
    const recebimentos = await prisma.contaAzulRecebimento.findMany({
      where: {
        empresaId: Number(empresaId)
      }
    })

    // 3. Cálculo dos Totais
    const resumo = {
      aReceber: 0,
      atrasado: 0,
      recebidoMes: 0
    }

    recebimentos.forEach(item => {
      const vencimento = new Date(item.data_vencimento)

      // -- CARD 1: EM ATRASO (Acumulado Histórico) --
      // Soma tudo que está atrasado, independente se é de 2023, 2024 ou mês atual.
      if (item.status === 'OVERDUE' || item.status === 'ATRASADO') {
        resumo.atrasado += item.Venda_A_Receber || 0
      }

      // -- VERIFICA SE PERTENCE AO MÊS SELECIONADO NO FILTRO --
      // Para os outros cards, só queremos saber do mês que o usuário escolheu.
      const pertenceAoMes = vencimento >= primeiroDia && vencimento <= ultimoDia

      if (pertenceAoMes) {
        // -- CARD 2: RECEBIDO (Apenas no mês selecionado) --
        if (
          item.status === 'ACQUITTED' ||
          item.status === 'RECEBIDO' ||
          item.status === 'PARTIAL' ||
          item.status === 'RECEBIDO_PARCIAL'
        ) {
          resumo.recebidoMes += item.Venda_Pago || 0
        }

        // -- CARD 3: A RECEBER (Apenas no mês selecionado) --
        if (item.status === 'PENDING' || item.status === 'EM_ABERTO') {
          resumo.aReceber += item.Venda_A_Receber || 0
        }
      }
    })

    return NextResponse.json(resumo)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
