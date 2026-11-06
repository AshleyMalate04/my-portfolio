import type { UseQueryResult } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocale } from '../i18n/context'
import { ApiError } from '../lib/api/client'
import { buttonStyles } from './ui/styles'

interface QueryStateProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  /** Mostrado quando a API responde 404 ou a lista vem vazia. */
  empty?: ReactNode
  /** Substitui o indicador de carregamento genérico (ex.: esqueleto com as proporções da página). */
  loading?: ReactNode
}

/** Estados uniformes de carregamento, erro e vazio para dados vindos da API. */
export function QueryState<T>({ query, children, empty = null, loading }: QueryStateProps<T>) {
  const { t } = useLocale()

  if (query.isPending) {
    return (
      loading ?? (
        <p role="status" className="animate-pulse text-ink-muted">
          {t.states.loading}
        </p>
      )
    )
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.kind === 'not_found') return <>{empty}</>

    return (
      <div role="alert" className="mx-auto my-10 max-w-content px-4 sm:px-6">
        <div className="rounded-card border border-danger/30 bg-surface-raised p-6 sm:p-8">
          <p className="font-display text-2xl font-bold">{t.states.genericError}</p>
          <p className="mt-2 text-ink-muted">
            {query.error instanceof ApiError && query.error.kind !== 'server'
              ? query.error.message
              : t.states.offlineHint}
          </p>
          <button type="button" onClick={() => void query.refetch()} className={`${buttonStyles.primary} mt-6`}>
            <RotateCcw aria-hidden="true" className="size-4" />
            {t.states.retry}
          </button>
        </div>
      </div>
    )
  }

  if (Array.isArray(query.data) && query.data.length === 0) return <>{empty}</>

  return <>{children(query.data)}</>
}
