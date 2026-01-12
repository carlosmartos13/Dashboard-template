import { NextResponse } from 'next/server'
import prisma from '@/libs/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validação básica
    if (!body.cnpj || !body.name) {
      return NextResponse.json({ message: 'CNPJ e Razão Social são obrigatórios' }, { status: 400 })
    }

    // Cria ou atualiza a empresa baseada no CNPJ
    // Usamos upsert para evitar duplicidade
    const company = await prisma.company.upsert({
      where: { cnpj: body.cnpj.replace(/\D/g, '') }, // Remove pontuação para busca
      update: { ...body },
      create: { ...body }
    })

    return NextResponse.json({ success: true, data: company }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao salvar empresa' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Busca a primeira empresa cadastrada no banco
    const company = await prisma.company.findFirst()

    if (!company) {
      // Retorna um flag dizendo que está vazio, mas com status 200 (ok)
      return NextResponse.json({ empty: true }, { status: 200 })
    }

    return NextResponse.json(company, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar empresa:', error)
    return NextResponse.json({ message: 'Erro interno.' }, { status: 500 })
  }
}
