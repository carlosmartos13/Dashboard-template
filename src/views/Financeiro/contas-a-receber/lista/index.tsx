'use client'

import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import VendasRelatorioTable from './tabela'
import VendasCardsResumo from './VendasCardsResumo'
import VendasFilterCard from './VendasFilterCard'

const Financeirolista = () => {
  // Removemos useSession e useRouter.
  // Agora a proteção é feita pelo Middleware antes de chegar aqui.

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 6 }}>
        {/* Ajustei para 'item xs={12}' pois 'size' é do Grid v2,
            mas se seu MUI for v6+ pode manter size */}
        <VendasCardsResumo empresaId={1} selectedDate={selectedDate} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <VendasFilterCard date={selectedDate} setDate={setSelectedDate} />
      </Grid>

      <Grid size={{ xs: 12, md: 12 }}>
        <VendasRelatorioTable empresaId={1} selectedDate={selectedDate} />
      </Grid>
    </Grid>
  )
}

export default Financeirolista
