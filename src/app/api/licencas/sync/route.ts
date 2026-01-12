import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

const BASE_URL = 'https://api.tabletcloud.com.br'

export async function POST() {
  try {
    const config = await prisma.pdvIntegration.findFirst()
    if (!config || !config.accessToken) {
      return NextResponse.json({ message: 'Token não configurado.' }, { status: 401 })
    }

    // --- CORREÇÃO: Voltamos para PAGINAÇÃO SEQUENCIAL (1, 2, 3...) ---
    let page = 1
    let loopControl = true

    // Contadores para o relatório
    let totalGruposSynced = 0
    let totalFiliaisSynced = 0

    console.log('--- INICIANDO SINCRONIZAÇÃO (Modo Página Sequencial) ---')

    while (loopControl) {
      // Agora a URL é apenas o número da página: 1, 2, 3...
      const url = `${BASE_URL}/licenciamento/minhaslicencas/${page}`

      console.log(`📡 Buscando PÁGINA ${page}...`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Página 404 encontrada (Fim da lista).')
          break
        }
        throw new Error(`Erro API: ${response.status}`)
      }

      const json = await response.json()
      const grupos = json.data || []

      // Log informativo do total que a API diz ter
      if (page === 1) {
        console.log(`ℹ️ A API informa um Total Geral de: ${json.total || 'Desconhecido'}`)
      }

      // Se a página vier vazia, ACABOU.
      if (grupos.length === 0) {
        console.log('Array vazio recebido. Fim da paginação.')
        break
      }

      console.log(`✅ Página ${page}: Recebidos ${grupos.length} grupos. Processando...`)

      // --- PROCESSAMENTO (Salvar no Banco) ---
      for (const grupo of grupos) {
        const dataCadastro = grupo.datacadastro ? new Date(grupo.datacadastro) : new Date()

        // 1. Salva o Grupo
        const grupoSalvo = await prisma.pdvLicencaGrupo.upsert({
          where: { codGrupo: grupo.codgrupo },
          update: {
            nome: grupo.nomegrupo,
            ativo: grupo.ativo,
            documento: grupo.cpf_cnpj,
            produto: grupo.produto,
            qtdLojasAtivas: grupo.qtdLojasAtivas,
            qtdLojasDesativadas: grupo.qtdLojasDesativadas,
            dataCadastroApi: dataCadastro
          },
          create: {
            codGrupo: grupo.codgrupo,
            nome: grupo.nomegrupo,
            ativo: grupo.ativo,
            documento: grupo.cpf_cnpj,
            produto: grupo.produto,
            qtdLojasAtivas: grupo.qtdLojasAtivas,
            qtdLojasDesativadas: grupo.qtdLojasDesativadas,
            dataCadastroApi: dataCadastro
          }
        })

        // 2. Salva as Filiais
        if (grupo.filiais && grupo.filiais.length > 0) {
          totalFiliaisSynced += grupo.filiais.length

          for (const filial of grupo.filiais) {
            const dataFilial = filial.datacadastro ? new Date(filial.datacadastro) : new Date()

            await prisma.pdvLicencaFilial.upsert({
              where: { codFilial: filial.codfilial },
              update: {
                nome: filial.nomefilial,
                ativo: filial.ativo,
                matriz: filial.matriz,
                documento: filial.cpf_cnpj,
                email: filial.email,
                dataCadastroApi: dataFilial,
                grupoId: grupoSalvo.id,
                codGrupo: grupo.codgrupo,
                sistema: 'PDVLEGAL'
              },
              create: {
                codFilial: filial.codfilial,
                nome: filial.nomefilial,
                ativo: filial.ativo,
                matriz: filial.matriz,
                documento: filial.cpf_cnpj,
                email: filial.email,
                dataCadastroApi: dataFilial,
                grupoId: grupoSalvo.id,
                codGrupo: grupo.codgrupo,
                sistema: 'PDVLEGAL'
              }
            })
          }
        }
      }

      totalGruposSynced += grupos.length

      // VAI PARA A PRÓXIMA PÁGINA (1 -> 2 -> 3)
      page++
    }

    console.log(`--- FIM. Grupos processados: ${totalGruposSynced} | Filiais: ${totalFiliaisSynced} ---`)

    return NextResponse.json({
      success: true,
      message: `Sucesso! Foram sincronizados ${totalGruposSynced} Grupos e ${totalFiliaisSynced} Lojas.`
    })
  } catch (error: any) {
    console.error('Erro na sync:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
