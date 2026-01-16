'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid' // Verifique se sua versão usa Grid ou Grid2
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'

// Types
type ProductDetail = {
  name: string
  active: number
  inactive: number
}

type StatsState = {
  ativas: number
  inativas: number
  pdvLegalTotal: number
  pdvLegalDetails: ProductDetail[]
}

// --- COMPONENTE INTERNO: CARD SIMPLES (Substitui o HorizontalWithSubtitle) ---
// Isso remove a obrigatoriedade do 'trend' e remove o sinal de (+)
const CardEstatisticaSimples = ({
  title,
  stats,
  icon,
  color,
  subtitle,
  loading
}: {
  title: string
  stats: string
  icon: string
  color: 'primary' | 'error' | 'warning' | 'success' | 'info'
  subtitle: string
  loading: boolean
}) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Skeleton variant='rectangular' height={80} sx={{ borderRadius: 1 }} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  {title}
                </Typography>
                <Typography variant='h4' sx={{ color: 'text.primary' }}>
                  {stats}
                </Typography>
              </Box>
              <Avatar variant='rounded' sx={{ width: 42, height: 42, bgcolor: `${color}.main` }}>
                <i className={icon} style={{ fontSize: '26px' }} />
              </Avatar>
            </Box>
            <Typography variant='caption' sx={{ color: 'text.disabled', mt: 'auto' }}>
              {subtitle}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const UserListCards = () => {
  // --- STATES ---
  const [stats, setStats] = useState<StatsState>({
    ativas: 0,
    inativas: 0,
    pdvLegalTotal: 0,
    pdvLegalDetails: []
  })
  const [loading, setLoading] = useState(true)

  // --- FETCH ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/licencas/stats')
        const json = await res.json()

        if (res.ok) {
          setStats({
            ativas: json.ativas,
            inativas: json.inativas,
            pdvLegalTotal: json.pdvLegal.total,
            pdvLegalDetails: json.pdvLegal.details || []
          })
        }
      } catch (error) {
        console.error('Falha ao buscar stats', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <Grid container spacing={6} sx={{ alignItems: 'stretch' }}>
      {/* --- CARD 1: ATIVOS --- */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardEstatisticaSimples
          title='Clientes Ativos'
          stats={stats.ativas.toString()}
          icon='tabler-users'
          color='success'
          subtitle='Base ativa (s/ Delivery/Cert.)'
          loading={loading}
        />
      </Grid>

      {/* --- CARD 2: INATIVOS --- */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardEstatisticaSimples
          title='Clientes Inativos'
          stats={stats.inativas.toString()}
          icon='tabler-user-off'
          color='error'
          subtitle='Total de filiais desativadas'
          loading={loading}
        />
      </Grid>

      {/* --- CARD 3: PDVLEGAL (CUSTOMIZADO) --- */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <Skeleton variant='rectangular' height='100%' sx={{ borderRadius: 1 }} />
            ) : (
              <>
                {/* Cabeçalho */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      PDVLEGAL
                    </Typography>
                    <Typography variant='h4' sx={{ color: 'text.primary' }}>
                      {stats.pdvLegalTotal}
                    </Typography>
                  </Box>
                  <Avatar variant='rounded' sx={{ width: 42, height: 42, bgcolor: '#00447d' }}>
                    <i className='tabler-device-tablet-share text-[26px]' />
                  </Avatar>
                </Box>

                {/* Lista Compacta de Produtos */}
                <Box display='flex' flexDirection='column' gap={1} sx={{ mt: 'auto' }}>
                  {stats.pdvLegalDetails.map((prod, index) => (
                    <Box key={index} width='100%'>
                      <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {prod.name}
                        </Typography>

                        <Box display='flex' gap={0.5}>
                          {/* Ativos */}
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={0.5}
                            sx={{ bgcolor: 'rgba(40, 199, 111, 0.1)', px: 0.8, py: 0.2, borderRadius: 1 }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'success.main' }} />
                            <Typography
                              variant='caption'
                              color='success.main'
                              fontWeight='bold'
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {prod.active}
                            </Typography>
                          </Box>

                          {/* Inativos */}
                          {prod.inactive > 0 && (
                            <Box
                              display='flex'
                              alignItems='center'
                              sx={{ bgcolor: 'rgba(234, 84, 85, 0.1)', px: 0.8, py: 0.2, borderRadius: 1 }}
                            >
                              <Typography
                                variant='caption'
                                color='error.main'
                                fontWeight='bold'
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {prod.inactive}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {index < stats.pdvLegalDetails.length - 1 && <Divider sx={{ borderStyle: 'dashed', mt: 0.8 }} />}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* --- CARD 4: VoeCRM --- */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardEstatisticaSimples
          title='Voepdv'
          stats='0'
          icon='tabler-devices-pc'
          color='primary'
          subtitle='Em breve integração'
          loading={loading}
        />
      </Grid>
    </Grid>
  )
}

export default UserListCards
