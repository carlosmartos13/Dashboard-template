'use client'

import { useState, useEffect } from 'react' // <--- Adicione useEffect
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation' // <--- Adicione useRouter (IMPORTANTE: de next/navigation)

// MUI Imports
import Grid from '@mui/material/Grid' // Confirme se é Grid ou Grid2 no seu MUI v7
import VendasRelatorioTable from './tabela'
import VendasCardsResumo from './VendasCardsResumo'
import VendasFilterCard from './VendasFilterCard'

const Financeirolista = () => {
  const { data: session, status } = useSession()
  const router = useRouter() // <--- Instância do roteador
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Lógica de Redirecionamento (Efeito Colateral)
  useEffect(() => {
    // Só executa quando terminar de carregar a sessão
    if (status === 'loading') return

    // Verifica se NÃO tem sessão OU se o cargo está errado
    const isAuthorized = session?.user && (session.user.role === 'FINANCEIRO' || session.user.role === 'SUPER_ADMIN')
    console.log('Usuário autorizado:', isAuthorized, session?.user)

    if (!isAuthorized) {
      // Redireciona para a página bonitona do template
      router.replace('/pt_BR/401-not-authorized')
    }
  }, [session, status, router])

  // Enquanto carrega ou se não estiver autorizado, não mostra NADA (ou um spinner)
  // Isso evita que a página "pisque" o conteúdo proibido antes de redirecionar
  if (status === 'loading' || !session || (session.user.role !== 'FINANCEIRO' && session.user.role !== 'SUPER_ADMIN')) {
    return null // Retornar null deixa a tela em branco enquanto redireciona
  }

  // --- SEU CONTEÚDO ORIGINAL ---
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 6 }}>
        <VendasCardsResumo empresaId={1} selectedDate={selectedDate} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <VendasFilterCard date={selectedDate} setDate={setSelectedDate} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <VendasRelatorioTable empresaId={1} selectedDate={selectedDate} />
      </Grid>
    </Grid>
  )
}

export default Financeirolista
