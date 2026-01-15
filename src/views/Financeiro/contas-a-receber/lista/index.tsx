'use client'

import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import VendasRelatorioTable from './tabela'
import VendasCardsResumo from './VendasCardsResumo'
import VendasFilterCard from './VendasFilterCard'

// 1. Definimos o que esse componente espera receber.
// Se você souber o tipo exato (UsersType), troque o 'any' por ele.
interface FinanceiroListaProps {
  userData: any
}

// 2. Adicionamos a prop na função do componente
const Financeirolista = ({ userData }: FinanceiroListaProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // DICA: Provavelmente o ID da empresa vem dentro de userData.
  // Algo como: const idEmpresa = userData?.empresaId || 1;
  // Por enquanto mantive o 1 para não quebrar, mas é aqui que você arruma os dados errados.
  const idEmpresa = 1

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 6 }}>
        {/* Aqui passamos a variável, e não o número fixo */}
        <VendasCardsResumo empresaId={idEmpresa} selectedDate={selectedDate} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <VendasFilterCard date={selectedDate} setDate={setSelectedDate} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        {/* Aqui também */}
        <VendasRelatorioTable empresaId={idEmpresa} selectedDate={selectedDate} />
      </Grid>
    </Grid>
  )
}

export default Financeirolista
