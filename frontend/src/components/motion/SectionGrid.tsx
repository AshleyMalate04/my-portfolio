import type { CSSProperties } from 'react'

type Tone = 'paper' | 'band'

/**
 * Grelha técnica de fundo, no espírito do hero. A cor vem dos tokens
 * para continuar legível no tema claro, no escuro e nas faixas invertidas.
 */
export function SectionGrid({ tone = 'paper' }: { tone?: Tone }) {
  const line = tone === 'band' ? 'var(--grid-line-band)' : 'var(--grid-line)'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--section-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--section-grid)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
      style={{ '--section-grid': line } as CSSProperties}
    />
  )
}
