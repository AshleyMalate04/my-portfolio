import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'

/**
 * Profundidade com o scroll: o elemento desloca-se mais devagar ou mais depressa do que
 * a página enquanto atravessa o ecrã. `y` e `x` são os deslocamentos máximos em píxeis
 * (positivo = fica para trás; negativo = adianta-se).
 */
export function ScrollDepth({
  children,
  className,
  y = 40,
  x = 0,
}: {
  children: ReactNode
  className?: string
  y?: number
  x?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const translateY = useTransform(scrollYProgress, [0, 1], [y, -y])
  const translateX = useTransform(scrollYProgress, [0, 1], [x, -x])

  if (reduce)
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )

  return (
    <m.div ref={ref} className={className} style={{ y: translateY, x: translateX }}>
      {children}
    </m.div>
  )
}
