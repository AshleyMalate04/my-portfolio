import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ApiError } from '../../lib/api/client'
import { ErrorBlock } from './ui/Page'
import { useAdminSession } from './useAdminSession'

/** Protege as rotas do backoffice no cliente; a autorização real é sempre feita pelo Laravel. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useAdminSession()
  const location = useLocation()

  if (session.isPending) {
    return (
      <div role="status" className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        A verificar a sessão…
      </div>
    )
  }

  if (session.isError) {
    if (
      session.error instanceof ApiError &&
      (session.error.kind === 'unauthenticated' || session.error.kind === 'forbidden')
    ) {
      return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    }

    return (
      <div className="mx-auto max-w-md p-8">
        <ErrorBlock message="Não foi possível verificar a sessão." onRetry={() => void session.refetch()} />
      </div>
    )
  }

  return <>{children}</>
}
