import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/api/admin'
import { ApiError } from '../../lib/api/client'
import { queryKeys } from '../../lib/api/queryKeys'

/**
 * Sessão do backoffice validada pelo servidor (GET /admin/auth/me).
 * Nunca se confia em estado local para decidir se alguém é administrador.
 */
export function useAdminSession() {
  return useQuery({
    queryKey: queryKeys.adminSession,
    queryFn: adminApi.me,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    staleTime: 60_000,
  })
}
