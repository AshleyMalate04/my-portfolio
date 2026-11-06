import { LoaderCircle, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { adminButton } from '../ui/styles'

/**
 * Barra fixa no fundo dos formulários longos: indica alterações por guardar e mantém
 * o botão de gravar sempre acessível.
 */
export function SaveBar({
  isDirty,
  isSaving,
  label = 'Guardar alterações',
  errors,
  extra,
}: {
  isDirty: boolean
  isSaving: boolean
  label?: string
  errors?: string[]
  extra?: ReactNode
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
      {errors && errors.length > 0 && (
        <ul role="alert" className="mb-3 space-y-1 text-sm text-danger">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {isSaving ? (
            'A guardar…'
          ) : isDirty ? (
            <span className="inline-flex items-center gap-2 font-medium text-accent-ink">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              Alterações por guardar
            </span>
          ) : (
            'Sem alterações por guardar'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {extra}
          <button type="submit" disabled={isSaving || !isDirty} className={adminButton.primary}>
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {label}
          </button>
        </div>
      </div>
    </div>
  )
}
