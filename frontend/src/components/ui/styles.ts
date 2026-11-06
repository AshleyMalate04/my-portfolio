/**
 * Classes partilhadas de botões e etiquetas, para que links e botões tenham o mesmo aspecto
 * sem duplicar estilos. Áreas de toque com pelo menos 44px de altura (WCAG 2.5.8).
 */
const buttonBase =
  'group inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 font-medium transition-[transform,background-color,color,box-shadow] duration-fast ease-out-expo hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100'

export const buttonStyles = {
  /** Coral com texto ameixa (contraste ≈ 5,6:1). */
  primary: `${buttonBase} bg-accent text-plum-950 shadow-[0_8px_24px_-12px_rgb(255_90_54/0.8)] hover:shadow-[0_12px_28px_-10px_rgb(255_90_54/0.9)]`,
  dark: `${buttonBase} bg-ink text-ink-inverse hover:opacity-90`,
  outline: `${buttonBase} border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-ink-inverse`,
  outlineLight: `${buttonBase} border border-band-ink/30 text-band-ink hover:border-band-ink hover:bg-band-ink hover:text-band`,
}

export const tagStyle =
  'inline-flex items-center rounded-pill border border-current/15 px-3 py-1 font-mono text-[0.72rem] tracking-wide'

/** Link de texto com sublinhado animado. */
export const textLinkStyle =
  'link-underline underline-offset-4 decoration-transparent transition-colors hover:text-accent-ink'
