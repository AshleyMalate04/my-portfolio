import { m, useReducedMotion, useScroll, useSpring } from 'motion/react'

/** Indicador discreto de leitura no topo do site público. */
export function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 })

  if (reduce) return null

  return (
    <m.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-0.5 origin-left bg-accent"
      style={{ scaleX }}
    />
  )
}
