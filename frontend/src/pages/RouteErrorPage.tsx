import { isRouteErrorResponse, useRouteError } from 'react-router'
import { NotFoundPage } from './NotFoundPage'

/** Erros inesperados de renderização/rotas: mensagem simples, sem detalhes técnicos para o visitante. */
export function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  if (import.meta.env.DEV) console.error(error)

  return (
    <main className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold">Ocorreu um erro inesperado</h1>
      <p className="mt-4 text-ink-muted">Recarregue a página ou tente novamente dentro de alguns minutos.</p>
    </main>
  )
}
