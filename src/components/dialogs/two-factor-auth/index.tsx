'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// NextAuth Imports
import { useSession } from 'next-auth/react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'

// Input OTP Imports (Para a melhor UX)
import { OTPInput } from 'input-otp'
import type { SlotProps } from 'input-otp'
import classnames from 'classnames'
import styles from '@/libs/styles/inputOtp.module.css' // Certifique-se que este CSS existe (o mesmo do login)

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomInputHorizontal from '@core/components/custom-inputs/Horizontal'
import DialogCloseButton from '../DialogCloseButton'
import type { CustomInputHorizontalData } from '@core/components/custom-inputs/types'

// --- COMPONENTES VISUAIS DO OTP (SLOTS) ---
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

type TwoFactorAuthProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

const data: CustomInputHorizontalData[] = [
  {
    title: (
      <div className='flex items-top gap-1'>
        <i className='tabler-settings text-xl shrink-0' />
        <Typography className='font-medium' color='text.primary'>
          Google Authenticator / Authenticator App
        </Typography>
      </div>
    ),
    value: 'app',
    isSelected: true,
    content: 'Obtenha o código de um aplicativo como o Google Authenticator ou o Microsoft Authenticator.'
  },
  {
    title: (
      <div className='flex items-top gap-1'>
        <i className='tabler-mail text-xl shrink-0' />
        <Typography className='font-medium' color='text.primary'>
          E-MAIL
        </Typography>
      </div>
    ),
    value: 'E-MAIL',
    content: 'Enviaremos um código por e-mail caso precise usar seu método de login alternativo.'
  }
]

// --- 1. COMPONENTE E-MAIL (REFEITO E OTIMIZADO) ---
type EmailDialogProps = {
  handleClose: () => void
  userEmail: string | undefined | null
  onSuccess: (backupCodes: string[]) => void
}

const EmailDialog = ({ handleClose, userEmail, onSuccess }: EmailDialogProps) => {
  // Estados do Fluxo
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; severity: 'error' | 'success' | null }>({
    message: '',
    severity: null
  })

  // 1. Enviar Código por Email
  const handleSendCode = async () => {
    setLoading(true)
    setFeedback({ message: '', severity: null })
    try {
      const res = await fetch('/api/auth/2fa/email/send', { method: 'POST' })
      const data = await res.json()

      if (res.status === 429) {
        setFeedback({ message: 'Muitos envios. Aguarde 60 segundos.', severity: 'error' })
      } else if (res.ok) {
        setStep('verify') // Avança para a tela de digitar
        setFeedback({ message: 'Código enviado! Verifique sua caixa de entrada.', severity: 'success' })
      } else {
        setFeedback({ message: data.message || 'Erro ao enviar email.', severity: 'error' })
      }
    } catch (error) {
      setFeedback({ message: 'Erro de conexão.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 2. Verificar Código (Auto-submit chama isso)
  const handleVerifyCode = async (codeToCheck: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: codeToCheck })
      })
      const data = await res.json()

      if (res.status === 429) {
        setFeedback({ message: 'Muitas tentativas erradas. Aguarde 10 minutos.', severity: 'error' })
      } else if (res.ok) {
        // SUCESSO!
        onSuccess(data.backupCodes || [])
      } else {
        setFeedback({ message: data.message || 'Código inválido.', severity: 'error' })
        setOtp('') // Limpa para tentar de novo
      }
    } catch (error) {
      setFeedback({ message: 'Erro ao verificar.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Efeito: Auto-submit
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyCode(otp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp])

  return (
    <>
      <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Verificação por E-mail
      </DialogTitle>

      <DialogContent className='flex flex-col gap-6 pbs-0 sm:pli-16'>
        {feedback.message && (
          <Alert severity={feedback.severity as any} className='mb-4'>
            {feedback.message}
          </Alert>
        )}

        {step === 'send' ? (
          <div className='text-center flex flex-col gap-4'>
            <Typography>
              Enviaremos um código de verificação para: <br />
              <strong>{userEmail}</strong>
            </Typography>
            <div className='flex justify-center'>
              <i className='tabler-mail-forward text-[64px] text-primary' />
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-4 items-center'>
            <Typography>Digite o código de 6 dígitos enviado para seu e-mail.</Typography>

            {/* OTP Input igual ao do Login */}
            <OTPInput
              onChange={setOtp}
              value={otp}
              maxLength={6}
              disabled={loading}
              containerClassName='flex items-center gap-2'
              render={({ slots }) => (
                <div className='flex items-center justify-between w-full gap-4'>
                  {slots.map((slot, idx) => (
                    <Slot key={idx} {...slot} />
                  ))}
                </div>
              )}
            />
            <Typography variant='caption' className='text-textDisabled'>
              Não recebeu?{' '}
              <span className='text-primary cursor-pointer hover:underline' onClick={handleSendCode}>
                Reenviar
              </span>
            </Typography>
          </div>
        )}
      </DialogContent>

      <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='tonal' color='secondary' onClick={handleClose}>
          Cancelar
        </Button>

        {step === 'send' && (
          <Button color='primary' variant='contained' onClick={handleSendCode} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Enviar Código'}
          </Button>
        )}

        {step === 'verify' && (
          <Button
            color='success'
            variant='contained'
            disabled={loading || otp.length < 6}
            onClick={() => handleVerifyCode(otp)}
          >
            {loading ? <CircularProgress size={20} /> : 'Verificar'}
          </Button>
        )}
      </DialogActions>
    </>
  )
}

// --- 2. COMPONENTE APP (QR Code) - Mantido igual mas otimizado ---
type AppDialogProps = {
  handleClose: () => void
  qrCodeUrl: string
  token: string
  setToken: (val: string) => void
  onVerify: () => void
  loading: boolean
}

const AppDialog = ({ handleClose, qrCodeUrl, token, setToken, onVerify, loading }: AppDialogProps) => {
  // Tratamento para garantir apenas números e max 6 chars
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setToken(val)
  }

  return (
    <>
      <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Adicionar Autenticação de Dois Fatores
      </DialogTitle>
      <DialogContent className='flex flex-col gap-6 pbs-0 sm:pli-16'>
        <div className='flex flex-col gap-2'>
          <Typography variant='h5'>Authenticator Apps</Typography>
          <Typography>
            Usando um aplicativo autenticador, escaneie o código QR. Ele gerará um código de 6 dígitos.
          </Typography>
        </div>
        <div className='flex justify-center'>
          {qrCodeUrl ? (
            <img alt='qr-code' height={150} width={150} src={qrCodeUrl} />
          ) : (
            <div className='flex justify-center items-center h-[150px] w-[150px]'>
              <CircularProgress />
            </div>
          )}
        </div>
        <div className='flex flex-col gap-4'>
          <Alert severity='warning' icon={false}>
            <AlertTitle>Google APP Authenticator</AlertTitle>
            Se tiver dificuldades com o QR Code, selecione entrada manual no seu app.
          </Alert>
          <CustomTextField
            fullWidth
            label='Código de Autenticação'
            placeholder='123456'
            value={token}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </DialogContent>
      <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='tonal' color='secondary' onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          color='success'
          variant='contained'
          onClick={onVerify}
          disabled={loading || token.length < 6}
          endIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-check' />}
        >
          Verificar e Ativar
        </Button>
      </DialogActions>
    </>
  )
}

// --- 3. COMPONENTE CÓDIGOS DE BACKUP ---
type BackupCodeDialogProps = {
  codes: string[]
  onFinish: () => void
}

const BackupCodeDialog = ({ codes, onFinish }: BackupCodeDialogProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join('\n'))
  }

  return (
    <>
      <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Códigos de Recuperação
      </DialogTitle>
      <DialogContent className='flex flex-col gap-6 pbs-0 sm:pli-16'>
        <div className='flex flex-col gap-2'>
          <Alert severity='info' icon={<i className='tabler-info-circle' />}>
            <AlertTitle>Importante!</AlertTitle>
            Salve estes códigos em um lugar seguro. Se você perder seu celular, poderá usar um destes códigos para
            entrar na sua conta. Cada código só pode ser usado uma vez.
          </Alert>
        </div>

        <Box className='grid grid-cols-2 gap-4 p-4 rounded bg-action-hover border border-divider'>
          {codes.map((code, index) => (
            <div key={index} className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[6px] text-textSecondary' />
              <Typography className='font-mono font-bold tracking-wider'>{code}</Typography>
            </div>
          ))}
        </Box>

        <div className='flex justify-center'>
          <Button startIcon={<i className='tabler-copy' />} onClick={handleCopy}>
            Copiar Todos os Códigos
          </Button>
        </div>
      </DialogContent>

      <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='contained' color='primary' onClick={onFinish} fullWidth>
          Entendi, finalizei o backup
        </Button>
      </DialogActions>
    </>
  )
}

// --- 4. COMPONENTE PRINCIPAL ---
const TwoFactorAuth = ({ open, setOpen }: TwoFactorAuthProps) => {
  const { data: session, update } = useSession()
  const router = useRouter()

  // Estados
  const initialSelectedOption = data.filter(item => item.isSelected)[data.filter(item => item.isSelected).length - 1]
    .value
  const [authType, setAuthType] = useState<string>(initialSelectedOption)
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false)

  // Estados Lógicos (APP)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Estado Comum (Backup Codes)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Efeito para buscar QR Code (SÓ SE FOR APP)
  useEffect(() => {
    if (showAuthDialog && authType === 'app' && backupCodes.length === 0) {
      const fetchQr = async () => {
        try {
          const res = await fetch('/api/auth/2fa/generate')
          const data = await res.json()
          if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl)
        } catch (err) {
          console.error(err)
        }
      }
      fetchQr()
    }
  }, [showAuthDialog, authType, backupCodes.length])

  // --- LÓGICA DE VERIFICAÇÃO (APP) ---
  const handleVerifyApp = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
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
        handleSuccess(data.backupCodes)
      } else {
        setFeedback({ open: true, message: data.message || 'Código inválido', severity: 'error' })
      }
    } catch (err) {
      setFeedback({ open: true, message: 'Erro ao verificar', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // --- SUCESSO UNIFICADO (APP e EMAIL) ---
  const handleSuccess = async (codes: string[]) => {
    setFeedback({ open: true, message: '2FA Ativado! Salve seus códigos de backup.', severity: 'success' })
    if (codes && Array.isArray(codes)) {
      setBackupCodes(codes)
    }
    await update({ twoFactorEnabled: true })
  }

  // Auto-submit para APP
  useEffect(() => {
    if (token.length === 6 && showAuthDialog && authType === 'app') {
      handleVerifyApp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Handlers de UI
  const handleClose = () => {
    setOpen(false)
    resetState()
  }
  const handleAuthDialogClose = () => {
    setShowAuthDialog(false)
    resetState()
  }
  const resetState = () => {
    setToken('')
    setBackupCodes([])
    if (authType !== 'app') setTimeout(() => setAuthType('app'), 250)
  }
  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    setAuthType(typeof prop === 'string' ? prop : (prop.target as HTMLInputElement).value)
  }
  const handleFinishBackup = async () => {
    await update()
    router.refresh()
    setOpen(false)
    setShowAuthDialog(false)
    resetState()
  }

  return (
    <>
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={feedback.severity} variant='filled'>
          {feedback.message}
        </Alert>
      </Snackbar>

      {/* DIALOG 1: SELEÇÃO DE MÉTODO */}
      <Dialog
        fullWidth
        maxWidth='md'
        scroll='body'
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          Selecione o método de autenticação
        </DialogTitle>
        <DialogContent className='pbs-0 sm:pli-16'>
          <Grid container spacing={6}>
            {data.map((item, index) => (
              <CustomInputHorizontal
                type='radio'
                key={index}
                selected={authType}
                handleChange={handleOptionChange}
                data={item}
                gridProps={{ size: { xs: 12 } }}
                name='auth-method'
              />
            ))}
          </Grid>
        </DialogContent>
        <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16 flex justify-center'>
          <Button
            variant='contained'
            onClick={() => {
              setOpen(false)
              setShowAuthDialog(true)
            }}
          >
            Continuar
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleClose}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 2: CONFIGURAÇÃO / BACKUP */}
      <Dialog
        fullWidth
        maxWidth='md'
        scroll='body'
        open={showAuthDialog}
        onClose={handleAuthDialogClose}
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={handleAuthDialogClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <form onSubmit={e => e.preventDefault()}>
          {backupCodes.length > 0 ? (
            <BackupCodeDialog codes={backupCodes} onFinish={handleFinishBackup} />
          ) : authType === 'E-MAIL' ? (
            // COMPONENTE NOVO DE EMAIL
            <EmailDialog
              handleClose={handleAuthDialogClose}
              userEmail={session?.user?.email}
              onSuccess={handleSuccess}
            />
          ) : (
            <AppDialog
              handleClose={handleAuthDialogClose}
              qrCodeUrl={qrCodeUrl}
              token={token}
              setToken={setToken}
              onVerify={handleVerifyApp}
              loading={loading}
            />
          )}
        </form>
      </Dialog>
    </>
  )
}

export default TwoFactorAuth
