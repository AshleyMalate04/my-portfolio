import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import type { PageMeta } from '../types'
import { adminButton, inputStyle } from './styles'

/** Cabeçalho contextual de cada página do backoffice. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · Backoffice`
  }, [title])

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-sm text-ink-muted">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function LoadingBlock({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} aria-hidden="true" className="h-16 animate-pulse rounded-2xl bg-ink/5" />
      ))}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm">
      <p className="font-medium">Não foi possível carregar os dados.</p>
      <p className="mt-1 text-ink-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${adminButton.secondary} mt-4`}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

const badgeTones = {
  green: 'bg-success/10 text-success',
  grey: 'bg-ink/8 text-ink-muted',
  coral: 'bg-accent/15 text-accent-ink',
  butter: 'bg-butter-300/60 text-plum-950',
  lavender: 'bg-lavender-300/40 text-plum-950',
}

export function Badge({ tone = 'grey', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  )
}

/** Campo de pesquisa com atraso (evita um pedido por tecla). */
export function SearchInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (draft === value) return
    const timer = window.setTimeout(() => onChange(draft), 300)
    return () => window.clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        id={id}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={label}
        className={`${inputStyle} pl-9`}
      />
    </div>
  )
}

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.last_page <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-4 text-sm">
      <button
        type="button"
        className={adminButton.secondary}
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Anterior
      </button>
      <span className="text-ink-muted">
        Página {meta.current_page} de {meta.last_page} · {meta.total} registos
      </span>
      <button
        type="button"
        className={adminButton.secondary}
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        Seguinte
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  )
}

/** Interruptor acessível (role="switch") para publicar/ocultar e opções booleanas. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  hideLabel,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
  hideLabel?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-10 items-center gap-2 text-sm disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-ink/20'}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
        />
      </span>
      <span className={hideLabel ? 'sr-only' : ''}>{label}</span>
    </button>
  )
}
