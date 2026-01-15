// Component Imports
import FinanceiroLista from '@views/Financeiro/contas-a-receber/lista'

// Data Imports
import { getUserData } from '@/app/server/actions'

const Financeiro = async () => {
  // Vars
  const data = await getUserData()

  return <FinanceiroLista userData={data} />
}

export default Financeiro
