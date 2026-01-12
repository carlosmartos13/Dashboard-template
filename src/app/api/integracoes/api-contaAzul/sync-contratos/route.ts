import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import { getValidToken } from '@/views/empresas/settings/integracaoes/contaAzul/contaAzulAuthHelper'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { empresaId } = body

    if (!empresaId) return NextResponse.json({ error: 'EmpresaID obrigatório' }, { status: 400 })

    const accessToken = await getValidToken(Number(empresaId))

    // Filtros amplos para garantir que venha tudo
    const dataInicioBusca = '2015-01-01'
    const dataFimBusca = '2030-12-31'

    const baseUrl = 'https://api-v2.contaazul.com/v1/contratos'
    let paginaAtual = 1
    const tamanhoPagina = 20
    let temMaisPaginas = true
    let totalProcessados = 0
    let clientesAtualizados = 0

    console.log('--- INICIANDO SYNC CONTRATOS ---')

    while (temMaisPaginas) {
      const params = new URLSearchParams({
        pagina: paginaAtual.toString(),
        tamanho_pagina: tamanhoPagina.toString(),
        data_inicio: dataInicioBusca,
        data_fim: dataFimBusca
      })

      const fullUrl = `${baseUrl}?${params.toString()}`
      console.log(`📡 Buscando URL: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const txt = await response.text()
        throw new Error(`Erro API CA: ${response.status} - ${txt}`)
      }

      const data = await response.json()

      // LOG IMPORTANTE: Ver o que a API devolveu
      // A Conta Azul as vezes manda 'items', as vezes 'itens', as vezes nada.
      const listaContratos = data.items || data.itens || []

      console.log(`📄 Página ${paginaAtual}: Encontrados ${listaContratos.length} contratos na API.`)

      if (listaContratos.length === 0) {
        console.log('🚫 Nenhum contrato nesta página. Encerrando paginação.')
        temMaisPaginas = false
        break
      }

      await Promise.all(
        listaContratos.map(async (contrato: any) => {
          // Validação básica
          if (!contrato.cliente || !contrato.cliente.id) {
            console.log(`⚠️ Contrato ${contrato.numero} ignorado: Sem ID de Cliente.`)
            return
          }

          const clienteIdNaAPI = contrato.cliente.id

          try {
            // Tenta achar e atualizar
            const resultado = await prisma.contaAzulCliente.update({
              where: {
                caId: clienteIdNaAPI // Busca pelo UUID da Conta Azul
              },
              data: {
                contratoId: contrato.id,
                contratoStatus: contrato.status,
                contratoNumero: contrato.numero,
                // Tratamento de data seguro
                contratoInicio: contrato.data_inicio ? new Date(contrato.data_inicio + 'T12:00:00') : null,
                contratoVencimento: contrato.proximo_vencimento
                  ? new Date(contrato.proximo_vencimento + 'T12:00:00')
                  : null
              }
            })

            // Se chegou aqui, funcionou
            console.log(`✅ Contrato ${contrato.numero} vinculado ao cliente ${resultado.nome}`)
            clientesAtualizados++
          } catch (error: any) {
            // AQUI ESTÁ O ERRO QUE ESTAVA ESCONDIDO
            if (error.code === 'P2025') {
              console.error(
                `❌ Falha: Cliente não existe no banco. (ID CA: ${clienteIdNaAPI} - Nome: ${contrato.cliente.nome})`
              )
            } else {
              console.error(`❌ Erro Prisma genérico no contrato ${contrato.numero}:`, error.message)
            }
          }
        })
      )

      totalProcessados += listaContratos.length

      if (listaContratos.length < tamanhoPagina) {
        temMaisPaginas = false
      } else {
        paginaAtual++
      }
    }

    console.log('--- FIM SYNC CONTRATOS ---')

    return NextResponse.json({
      success: true,
      message: `Fim. ${totalProcessados} contratos lidos. ${clientesAtualizados} vinculados com sucesso.`,
      total: totalProcessados,
      atualizados: clientesAtualizados
    })
  } catch (error: any) {
    console.error('🔥 Erro CRÍTICO Sync Contratos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
