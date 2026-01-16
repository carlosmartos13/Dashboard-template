// src/app/[lang]/(blank-layout-pages)/reset-password/page.tsx

// Importe o componente que acabamos de criar
import ResetPassword from '@/views/ResetPassword'

// Server Action para pegar o modo (light/dark) do servidor
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Reset Password',
  description: 'Reset Password Page'
}

// 1. Adicione a palavra 'async' aqui antes dos parênteses
const ResetPasswordPage = async ({ searchParams }: { searchParams: { token?: string } }) => {
  // 2. Adicione a palavra 'await' aqui para esperar o valor chegar
  const mode = await getServerMode()

  return <ResetPassword mode={mode} token={searchParams?.token} />
}

export default ResetPasswordPage
