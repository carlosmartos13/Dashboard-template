'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// NextAuth Imports
import { useSession, signOut } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { OTPInput } from 'input-otp'
import type { SlotProps } from 'input-otp'
import classnames from 'classnames'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import { getLocalizedUrl } from '@/utils/i18n'
import AuthIllustrationWrapper from './AuthIllustrationWrapper'
import styles from '@/libs/styles/inputOtp.module.css'
import type { Locale } from '@configs/i18n'

// Styled Components
const Slot = (props: SlotProps) => {
  return (
    <div className={classnames(styles.slot, { [styles.slotActive]: props.isActive })}>
      {props.char !== null && <div>{props.char}</div>}
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  )
}
const FakeCaret = () => (
  <div className={styles.fakeCaret}>
    <div className='w-px h-5 bg-textPrimary' />
  </div>
)

const TwoStepsV1 = () => {
  const { lang: locale } = useParams()
  const router = useRouter()
  const { data: session, update } = useSession()

  // Detecta estados
  const isLoginVerification = session?.user?.isTwoFactorPending
  const method = session?.user?.twoFactorMethod || 'APP' // 'APP' ou 'EMAIL'

  const [otp, setOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Ref para evitar envio duplo do email no StrictMode do React
  const emailSent = useRef(false)

  // --- 1. DISPARO AUTOMÁTICO DE EMAIL ---
  useEffect(() => {
    // Só dispara se:
    // 1. Estiver no modo de login pendente
    // 2. O método for EMAIL
    // 3. Ainda não tiver enviado
    if (isLoginVerification && method === 'EMAIL' && !emailSent.current) {
      emailSent.current = true
      sendEmailCode()
    }
  }, [isLoginVerification, method])

  const sendEmailCode = async () => {
    setFeedback({ open: true, message: 'Enviando código por e-mail...', severity: 'info' })
    try {
      const res = await fetch('/api/auth/2fa/email/send', { method: 'POST' })
      if (res.ok) {
        setFeedback({ open: true, message: 'Código enviado para seu e-mail!', severity: 'success' })
      } else {
        setFeedback({ open: true, message: 'Erro ao enviar e-mail. Tente reenviar.', severity: 'error' })
      }
    } catch (error) {
      console.error(error)
    }
  }

  // --- FUNÇÃO DE ENVIO DE VERIFICAÇÃO ---
  const submitCode = async (code: string) => {
    if (loading) return
    setLoading(true)

    try {
      const apiUrl = isLoginVerification
        ? '/api/auth/2fa/login-check' // Agora essa API suporta EMAIL também
        : '/api/auth/2fa/disable'

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code })
      })

      const data = await res.json()

      if (res.status === 429) {
        setFeedback({
          open: true,
          message: data.message || 'Muitas tentativas. Aguarde 10 minutos.',
          severity: 'error'
        })
        setLoading(false)
        return
      }

      if (res.ok) {
        if (isLoginVerification) {
          await update({ isTwoFactorVerified: true })
          setFeedback({ open: true, message: 'Login verificado!', severity: 'success' })
          router.refresh()
          setTimeout(() => router.replace(getLocalizedUrl('/', locale as Locale)), 500)
        } else {
          await update({ twoFactorEnabled: false })
          setFeedback({ open: true, message: '2FA Desativado.', severity: 'success' })
          router.refresh()
          setTimeout(() => router.replace(getLocalizedUrl('/pages/user-profile/security', locale as Locale)), 500)
        }
      } else {
        setFeedback({ open: true, message: data.message || 'Código inválido.', severity: 'error' })
        setLoading(false)
      }
    } catch (error) {
      setFeedback({ open: true, message: 'Erro de conexão.', severity: 'error' })
      setLoading(false)
    }
  }

  // Auto-submit
  useEffect(() => {
    if (otp && otp.length === 6) {
      submitCode(otp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp && otp.length === 6) {
      submitCode(otp)
    }
  }

  const handleSwitchAccount = async () => {
    await signOut({ callbackUrl: getLocalizedUrl('/login', locale as Locale) })
  }

  // Textos dinâmicos baseados no Método
  const title = isLoginVerification ? 'Verificação em duas etapas 🔒' : 'Desativar Verificação ⚠️'

  let description = 'Insira o código de 6 dígitos.'
  if (isLoginVerification) {
    if (method === 'EMAIL') {
      description = `Enviamos um código para o seu e-mail (${session?.user?.email}).`
    } else {
      description = 'Insira o código do seu aplicativo autenticador.'
    }
  } else {
    description = 'Para sua segurança, confirme o código para desativar.'
  }

  const buttonText = isLoginVerification ? 'Verificar e Entrar' : 'Confirmar Desativação'
  const buttonColor = isLoginVerification ? 'primary' : 'error'

  return (
    <AuthIllustrationWrapper>
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={feedback.severity as any} variant='filled'>
          {feedback.message}
        </Alert>
      </Snackbar>

      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={getLocalizedUrl('/', locale as Locale)} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>{title}</Typography>
            <Typography>{description}</Typography>
          </div>

          <form noValidate autoComplete='off' onSubmit={handleManualSubmit} className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <OTPInput
                onChange={setOtp}
                value={otp ?? ''}
                maxLength={6}
                containerClassName='flex items-center'
                render={({ slots }) => (
                  <div className='flex items-center justify-between w-full gap-4'>
                    {slots.slice(0, 6).map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Link de Reenvio para Email */}
            {isLoginVerification && method === 'EMAIL' && (
              <div className='flex justify-end'>
                <Typography
                  variant='caption'
                  className='cursor-pointer text-primary hover:underline'
                  onClick={sendEmailCode}
                >
                  Não recebeu? Reenviar código
                </Typography>
              </div>
            )}

            <Button
              fullWidth
              variant='contained'
              type='submit'
              color={buttonColor}
              disabled={loading || !otp || otp.length < 6}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : buttonText}
            </Button>

            {!isLoginVerification && (
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography
                  color='primary.main'
                  component={Link}
                  href={getLocalizedUrl('/pages/user-profile/security', locale as Locale)}
                >
                  Cancelar
                </Typography>
              </div>
            )}

            {isLoginVerification && (
              <div className='flex flex-col items-center gap-4'>
                <Typography color='text.secondary' className='text-sm text-center'>
                  Não consegue acessar? Tente seus códigos de backup.
                </Typography>

                <Button
                  variant='text'
                  color='secondary'
                  size='small'
                  onClick={handleSwitchAccount}
                  startIcon={<i className='tabler-logout' />}
                >
                  Entrar com outra conta
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default TwoStepsV1
