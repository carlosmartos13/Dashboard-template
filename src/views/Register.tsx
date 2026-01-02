'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation' // Adicionei useRouter

// NextAuth Imports
import { signIn } from 'next-auth/react' // <--- Importante para o Google

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert' // <--- Para mostrar erros

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const Register = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hooks
  const router = useRouter()
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, '/images/pages/auth-mask-light.png', '/images/pages/auth-mask-dark.png')

  const characterIllustration = useImageVariant(
    mode,
    '/images/illustrations/auth/v2-register-light.png',
    '/images/illustrations/auth/v2-register-dark.png',
    '/images/illustrations/auth/v2-register-light-border.png',
    '/images/illustrations/auth/v2-register-dark-border.png'
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  // Captura os dados digitados
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Envia para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao registrar')
      }

      // Sucesso! Redireciona para o login
      router.push(getLocalizedUrl('/login', locale as Locale))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <RegisterIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href={getLocalizedUrl('/login', locale as Locale)}
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Aventura começa aqui 🚀</Typography>
            <Typography>Gerencie seu app de forma fácil e divertida!</Typography>
          </div>

          {/* Exibe Erro se houver */}
          {error && <Alert severity='error'>{error}</Alert>}

          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-6'>
            <CustomTextField
              autoFocus
              fullWidth
              label='Username'
              name='username'
              placeholder='Seu nome'
              value={formData.username}
              onChange={handleChange}
            />
            <CustomTextField
              fullWidth
              label='Email'
              name='email'
              placeholder='seu@email.com'
              value={formData.email}
              onChange={handleChange}
            />
            <CustomTextField
              fullWidth
              label='Password'
              name='password'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox />}
              label={
                <>
                  <span>Eu concordo com </span>
                  <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                    políticas e termos
                  </Link>
                </>
              }
            />
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Já tem uma conta?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
                Faça Login
              </Typography>
            </div>

            <Divider className='gap-2'>ou</Divider>

            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small'>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small'>
                <i className='tabler-brand-github-filled' />
              </IconButton>

              {/* --- BOTÃO DO GOOGLE CONFIGURADO --- */}
              <IconButton className='text-error' size='small' onClick={() => signIn('google', { callbackUrl: '/' })}>
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
