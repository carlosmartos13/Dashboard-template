
// Importe componentes do Material UI se quiser usar o design do template
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

const MinhaPagina = () => {
  return (
    <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Minha Primeira Página</Typography>
        <Typography>Olá! Este é o conteúdo da minha nova página no Vuexy.</Typography>
        </Grid>
    </Grid>
     
  )
}

export default MinhaPagina
