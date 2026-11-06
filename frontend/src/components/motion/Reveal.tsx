import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { motionDistance, motionDuration, motionEase } from './config'

export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'scale' | 'clip'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'li' | 'section' | 'article'
  from?: RevealFrom
}

const hidden: Record<RevealFrom, Record<string, number | string>> = {
  up: { opacity: 0, y: motionDistance.md },
  down: { opacity: 0, y: -motionDistance.sm },
  left: { opacity: 0, x: -motionDistance.lg },
  right: { opacity: 0, x: motionDistance.lg },
  scale: { opacity: 0, scale: 0.88 },
  clip: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
}

const visible: Record<RevealFrom, Record<string, number | string>> = {
  up: { opacity: 1, y: 0 },
  down: { opacity: 1, y: 0 },
  left: { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
  clip: { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
}

/**
 * Revela o conteúdo ao entrar no ecrã (uma vez). Com movimento reduzido, o conteúdo é
 * mostrado imediatamente: nada fica escondido à espera de uma animação.
 */
export function Reveal({ children, className, delay = 0, as = 'div', from = 'up' }: RevealProps) {
  const reduce = useReducedMotion()
  const Tag = as

  if (reduce) return <Tag className={className}>{children}</Tag>

  const Motion = m[as]

  return (
    <Motion
      className={className}
      initial={hidden[from]}
      whileInView={visible[from]}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: motionDuration.slow, ease: motionEase, delay }}
    >
      {children}
    </Motion>
  )
}

/** Linha de título que sobe por trás de uma máscara (entrada do hero). */
export function RevealLine({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  if (reduce) return <span className={className}>{children}</span>

  return (
    <span className={`block overflow-hidden pb-[0.08em] ${className ?? ''}`}>
      <m.span
        className="block"
        initial={{ y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: motionDuration.slow, ease: motionEase, delay }}
      >
        {children}
      </m.span>
    </span>
  )
}

/** Transição suave entre páginas. Não bloqueia a navegação nem o histórico. */
export function PageTransition({ children, id }: { children: ReactNode; id: string }) {
  const reduce = useReducedMotion()

  if (reduce) return <>{children}</>

  return (
    <m.div
      key={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.fast, ease: motionEase }}
    >
      {children}
    </m.div>
  )
}
