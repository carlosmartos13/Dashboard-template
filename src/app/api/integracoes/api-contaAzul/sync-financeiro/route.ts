import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import { getValidToken } from '@/views/empresas/settings/integracaoes/contaAzul/contaAzulAuthHelper'

export const maxDuration = 300

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { empresaId } = body

    if (!empresaId) return NextResponse.json({ error: 'EmpresaID obrigatório' }, { status: 400 })

    let accessToken = await getValidToken(Number(empresaId))

    // --- CÁLCULO DINÂMICO DE DATAS ---
    const hoje = new Date()

    // Data Início: Hoje - 30 dias
    const dataDe = new Date()
    dataDe.setDate(hoje.getDate() - 30)

    // Data Fim: Hoje + 30 dias
    const dataAte = new Date()
    dataAte.setDate(hoje.getDate() + 30)

    // Formatação para YYYY-MM-DD (Padrão exigido pela Conta Azul)
    const dataVencimentoDe = dataDe.toISOString().split('T')[0]
    const dataVencimentoAte = dataAte.toISOString().split('T')[0]

    console.log(`--- SYNC FINANCEIRO INTELIGENTE ---`)
    console.log(`Período: ${dataVencimentoDe} até ${dataVencimentoAte}`)

    // URL V2
    const baseUrl = 'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar'

    let paginaAtual = 1
    const tamanhoPagina = 20
    let temMaisPaginas = true
    let totalProcessados = 0
    let salvos = 0
    let errosTotal = 0

    while (temMaisPaginas) {
      await sleep(300)

      const params = new URLSearchParams({
        pagina: paginaAtual.toString(),
        tamanho_pagina: tamanhoPagina.toString(),
        data_vencimento_de: dataVencimentoDe,
        data_vencimento_ate: dataVencimentoAte
      })

      const fullUrl = `${baseUrl}?${params.toString()}`

      let response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        console.warn('⚠️ 401 Detectado. Renovando token...')
        try {
          accessToken = await getValidToken(Number(empresaId), true)
          response = await fetch(fullUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (err) {
          throw new Error('Falha de autenticação.')
        }
      }

      if (response.status === 429) {
        console.warn('⚠️ Rate Limit. Aguardando 5s...')
        await sleep(5000)
        continue
      }

      if (!response.ok) {
        const txt = await response.text()
        throw new Error(`Erro API CA: ${response.status} - ${txt}`)
      }

      const data = await response.json()
      const lista = data.itens || data.items || []

      if (lista.length === 0) {
        temMaisPaginas = false
        break
      }

      await Promise.all(
        lista.map(async (conta: any) => {
          if (!conta.cliente || !conta.cliente.id) {
            return
          }

          const dtVencimento = conta.data_vencimento ? new Date(conta.data_vencimento + 'T12:00:00') : new Date()
          const dtCriacao = conta.data_criacao ? new Date(conta.data_criacao) : new Date()
          const dtUpdate = conta.data_alteracao ? new Date(conta.data_alteracao) : new Date()

          try {
            await prisma.contaAzulRecebimento.upsert({
              where: { id_ca_receber: conta.id },
              update: {
                status: conta.status,
                total: Number(conta.total),
                Venda_CA: conta.descricao,
                data_vencimento: dtVencimento,
                Venda_Status: conta.status_traduzido,
                Venda_A_Receber: Number(conta.nao_pago),
                Venda_Pago: Number(conta.pago),
                Venda_dtCriacao: dtCriacao,
                Venda_DtUpdate: dtUpdate,
                client_nome: conta.cliente.nome
              },
              create: {
                id_ca_receber: conta.id,
                status: conta.status,
                total: Number(conta.total),
                Venda_CA: conta.descricao,
                data_vencimento: dtVencimento,
                Venda_Status: conta.status_traduzido,
                Venda_A_Receber: Number(conta.nao_pago),
                Venda_Pago: Number(conta.pago),
                Venda_dtCriacao: dtCriacao,
                Venda_DtUpdate: dtUpdate,

                // --- AQUI ESTAVA O ERRO ---
                // Removi a linha: client_id: conta.cliente.id,
                // Deixamos apenas o connect fazer o trabalho:

                client_nome: conta.cliente.nome,
                empresa: { connect: { id: Number(empresaId) } },
                cliente: { connect: { caId: conta.cliente.id } }
              }
            })
            salvos++
          } catch (err: any) {
            errosTotal++
            if (err.code === 'P2025') {
              console.error(`❌ Cliente não existe no banco! (Cliente: ${conta.cliente.nome})`)
            } else {
              console.error(`❌ Erro Prisma: ${err.message}`)
            }
          }
        })
      )

      totalProcessados += lista.length

      if (lista.length < tamanhoPagina) {
        temMaisPaginas = false
      } else {
        paginaAtual++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fim. Salvos: ${salvos}. Erros: ${errosTotal}`,
      total: totalProcessados,
      salvos: salvos,
      erros: errosTotal
    })
  } catch (error: any) {
    console.error('🔥 Erro Sync Financeiro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
