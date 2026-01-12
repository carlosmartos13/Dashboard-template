import { NextResponse } from 'next/server'
import prisma from '@/libs/db'
import { getValidToken } from '@/views/empresas/settings/integracaoes/contaAzul/contaAzulAuthHelper'

// Aumentei o tempo limite para 5 minutos, pois agora o script vai rodar mais devagar
export const maxDuration = 300

// Função de pausa (Freio da API)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { empresaId } = body

    if (!empresaId) {
      return NextResponse.json({ error: 'EmpresaID é obrigatório' }, { status: 400 })
    }

    const accessToken = await getValidToken(Number(empresaId))

    const baseUrl = 'https://api-v2.contaazul.com/v1/pessoas'
    let paginaAtual = 1
    const tamanhoPagina = 20
    let temMaisPaginas = true
    let totalSincronizados = 0

    console.log('--- INICIANDO SYNC CLIENTES (COM DELAY) ---')

    while (temMaisPaginas) {
      console.log(`⏳ Aguardando... (Rate Limit)`)
      await sleep(300) // <--- O SEGREDO: Pausa de 300ms antes de cada chamada

      console.log(`📡 Buscando página ${paginaAtual}...`)

      const url = `${baseUrl}?pagina=${paginaAtual}&tamanho_pagina=${tamanhoPagina}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      // Se der erro 429 mesmo com o sleep, vamos tentar esperar mais um pouco e tentar de novo (Retry simples)
      if (response.status === 429) {
        console.warn('⚠️ Rate Limit atingido! Esperando 2 segundos...')
        await sleep(2000)
        continue // Tenta a mesma página de novo
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro na API Conta Azul: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const items = data.items || []

      if (items.length === 0) {
        temMaisPaginas = false
        break
      }

      // Processamento em Lote
      await Promise.all(
        items.map(async (cliente: any) => {
          const dataCriacao = cliente.data_criacao ? new Date(cliente.data_criacao) : null
          const dataAlteracao = cliente.data_alteracao ? new Date(cliente.data_alteracao) : null

          return prisma.contaAzulCliente.upsert({
            where: { caId: cliente.id },
            update: {
              nome: cliente.nome,
              documento: cliente.documento,
              email: cliente.email,
              telefone: cliente.telefone,
              ativo: cliente.ativo,
              tipoPessoa: cliente.tipo_pessoa,
              perfis: cliente.perfis || [],
              observacoes: cliente.observacoes_gerais,
              dataAlteracaoCA: dataAlteracao
            },
            create: {
              caId: cliente.id,
              idLegado: cliente.id_legado,
              uuidLegado: cliente.uuid_legado,
              nome: cliente.nome,
              documento: cliente.documento,
              email: cliente.email,
              telefone: cliente.telefone,
              ativo: cliente.ativo,
              tipoPessoa: cliente.tipo_pessoa,
              perfis: cliente.perfis || [],
              observacoes: cliente.observacoes_gerais,
              dataCriacaoCA: dataCriacao,
              dataAlteracaoCA: dataAlteracao,
              empresa: {
                connect: { id: Number(empresaId) }
              }
            }
          })
        })
      )

      totalSincronizados += items.length

      if (items.length < tamanhoPagina) {
        temMaisPaginas = false
      } else {
        paginaAtual++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync Clientes OK: ${totalSincronizados} processados.`,
      total: totalSincronizados
    })
  } catch (error: any) {
    console.error('Erro Sync Clientes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
