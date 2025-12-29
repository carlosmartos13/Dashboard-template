'use client' // Necessário para usar estados (useState) e eventos

import { useState } from 'react'

import { 
  Grid, Card, CardHeader, CardContent, 
  TextField, Button, 
  Typography 
} from '@mui/material'



const ApiConfigPage = () => {
  const [showToken, ] = useState(false)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 4, md: 5 }}>
        <Typography variant='h4' sx={{ mb: 4 }}>
          Configurações de Conexão
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, lg: 4, md: 5 }}>
        <Card>
          <CardHeader title='Dados da API Externa' />
          <CardContent>
            <form onSubmit={e => e.preventDefault()}>
              <Grid container spacing={5}>
                {/* URL da API */}
                 <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label='Base URL da API'
                    placeholder='https://api.exemplo.com/v1'
                    helperText='Endpoint principal para as requisições'
                  />
                </Grid>

                {/* Token / API Key */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label='API Key / Bearer Token'
                    type={showToken ? 'text' : 'password'}
                  
                    
                  />
                </Grid>

                {/* Botões de Ação */}
               <Grid size={{ xs: 12 }}>
                  <Button variant='contained' sx={{ mr: 4 }}>
                    Salvar Configurações
                  </Button>
                  <Button variant='tonal' color='secondary' type='reset'>
                    Cancelar
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Coluna de Ajuda/Status */}
     <Grid size={{ xs: 12 }}>
        <Card sx={{ backgroundColor: 'action.hover' }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2 }}>Status da Conexão</Typography>
            <Typography variant='body2' color='text.secondary'>
              Certifique-se de que o servidor da API permite conexões do domínio atual (CORS).
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    
  )
}

export default ApiConfigPage
