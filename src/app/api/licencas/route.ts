import { NextResponse } from 'next/server'
import Prisma from '@prisma/client'
import prisma from '@/libs/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    console.log(`--- API GET: Buscando Matrizes (Pág ${page} | Busca: "${search || ''}") ---`)

    // 1. CONSTRUÇÃO DO FILTRO (WHERE)
    // Definimos explicitamente o tipo para o TypeScript aceitar a manipulação dinâmica
    const whereClause: Prisma.PdvLicencaFilialWhereInput = {
      matriz: true
    }

    if (search) {
      // Limpeza de dados
      const searchClean = search.replace(/\D/g, '') // Remove tudo que não é número
      const isNumeric = !isNaN(Number(searchClean)) && searchClean.length > 0

      // PROTEÇÃO DE INTEIROS (Postgres Integer Limit ~2.1bi)
      // Se o número tiver 10 dígitos ou mais (ex: CPF/CNPJ), não podemos buscar em campos Int (codFilial/codGrupo)
      // ou a query vai quebrar com erro de "Integer Overflow".
      const isSmallNumber = isNumeric && searchClean.length < 10

      // Termo para busca em texto (Documento)
      // Se limpou e sobrou algo (ex: CNPJ), usa o limpo. Se é nome ("Posto"), usa o original.
      const docTerm = searchClean.length > 0 ? searchClean : search

      // Montagem dinâmica das condições OR
      const orConditions: Prisma.PdvLicencaFilialWhereInput[] = [
        // Busca por Nome (Texto)
        { nome: { contains: search, mode: 'insensitive' } },
        // Busca por Documento (Texto String)
        { documento: { contains: docTerm } }
      ]

      // Só adiciona busca por ID numérico se for seguro
      if (isSmallNumber) {
        orConditions.push({ codFilial: Number(searchClean) })
        orConditions.push({ codGrupo: Number(searchClean) })
      }

      // Adiciona o bloco OR dentro do AND do filtro principal
      whereClause.AND = [{ OR: orConditions }]
    }

    // 2. BUSCA NO BANCO
    const matrizes = await prisma.pdvLicencaFilial.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        grupo: {
          include: {
            filiais: {
              where: {
                matriz: false
              },
              orderBy: {
                codFilial: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        dataCadastroApi: 'desc'
      }
    })

    // 3. CONTAGEM TOTAL (Usando o mesmo where para a paginação bater)
    const total = await prisma.pdvLicencaFilial.count({
      where: whereClause
    })

    return NextResponse.json({
      data: matrizes,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit) || 1
      }
    })
  } catch (error: any) {
    console.error('ERRO API:', error)
    return NextResponse.json({ message: 'Erro ao buscar licenças', error: error.message }, { status: 500 })
  }
}
