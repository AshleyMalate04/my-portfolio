/** Estilos do backoffice: mais compactos do que o site público, com a mesma identidade. */
const base =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus'

export const adminButton = {
  primary: `${base} bg-ink text-ink-inverse hover:opacity-90`,
  accent: `${base} bg-accent text-plum-950 hover:bg-[#ff6f50]`,
  secondary: `${base} border border-ink/20 bg-surface-raised text-ink hover:border-ink/50`,
  ghost: `${base} text-ink hover:bg-ink/5`,
  danger: `${base} bg-danger text-ivory-50 hover:opacity-90`,
  dangerGhost: `${base} text-danger hover:bg-danger/10`,
  icon: 'inline-flex size-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/5 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus',
}

export const inputStyle =
  'block w-full min-h-10 rounded-lg border border-ink/20 bg-surface-raised px-3 py-2 text-sm transition-colors placeholder:text-ink-muted/60 hover:border-ink/40 focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-focus aria-invalid:border-danger disabled:opacity-60'

export const cardStyle = 'rounded-2xl border border-line bg-surface-raised'
