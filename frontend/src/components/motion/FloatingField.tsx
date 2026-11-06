import { useReducedMotion } from 'motion/react'

type Tone = 'hero' | 'quiet'

/**
 * Formas abstractas em planos diferentes. Discretas, em movimento contínuo,
 * e desligadas quando o utilizador pede menos animação.
 */
export function FloatingField({ tone = 'hero' }: { tone?: Tone }) {
  const reduce = useReducedMotion()

  if (reduce) return null

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {tone === 'hero' ? <HeroShapes /> : <QuietShapes />}
    </div>
  )
}

function HeroShapes() {
  return (
    <>
      <span className="orb orb-a bg-accent" />
      <span className="orb orb-b bg-support" />
      <span className="orb orb-c bg-highlight" />
      <span className="glyph glyph-a font-mono">{'{ }'}</span>
      <span className="glyph glyph-b font-mono">/</span>
      <span className="dot dot-a" />
      <span className="dot dot-b" />
      <span className="dot dot-c" />
    </>
  )
}

function QuietShapes() {
  return (
    <>
      <span className="orb orb-quiet bg-support" />
      <span className="dot dot-quiet" />
    </>
  )
}
