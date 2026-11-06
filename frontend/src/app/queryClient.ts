import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api/client'

/** Emitido quando um pedido do backoffice recebe 401 (sessão expirada ou terminada noutro separador). */
export const SESSION_EXPIRED_EVENT = 'admin:session-expired'

/**
 * Um 401 num pedido administrativo significa que a sessão expirou durante o uso do painel.
 * A verificação inicial (/admin/auth/me) é excluída: aí o 401 apenas indica que ainda não há sessão.
 */
function notifyExpiredSession(error: unknown) {
  if (
    error instanceof ApiError &&
    error.kind === 'unauthenticated' &&
    error.path?.startsWith('/admin/') &&
    !error.path.startsWith('/admin/auth/')
  ) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: notifyExpiredSession }),
    mutationCache: new MutationCache({ onError: notifyExpiredSession }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Erros do cliente (4xx) não melhoram com novas tentativas; falhas de rede/servidor sim.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  })
}
