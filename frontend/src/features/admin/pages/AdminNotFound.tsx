import { Link } from 'react-router'
import { EmptyState } from '../ui/Page'
import { adminButton } from '../ui/styles'

export function AdminNotFound() {
  return (
    <EmptyState
      title="Página não encontrada"
      action={
        <Link to="/admin" className={adminButton.primary}>
          Voltar ao painel
        </Link>
      }
    >
      Este endereço não existe no backoffice.
    </EmptyState>
  )
}
