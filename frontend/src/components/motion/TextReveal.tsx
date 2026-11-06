import { m, useReducedMotion } from 'motion/react'
import { motionDuration, motionEase } from './config'

type Mode = 'words' | 'lines'

/**
 * Revela um título palavra a palavra (ou como um bloco). O texto completo fica
 * disponível para leitores de ecrã; a animação é puramente visual.
 */
export function TextReveal({
  text,
  className,
  delay = 0,
  mode = 'words',
}: {
  text: string
  className?: string
  delay?: number
  mode?: Mode
}) {
  const reduce = useReducedMotion()

  if (reduce || mode === 'lines') {
    return <span className={className}>{text}</span>
  }

  const words = text.split(/(\s+)/)

  return (
    <span className={className} aria-hidden="true">
      {words.map((word, index) =>
        word.trim() === '' ? (
          <span key={`s-${index}`}>{word}</span>
        ) : (
          <span key={`w-${index}`} className="inline-block overflow-hidden pb-[0.08em] align-baseline">
            <m.span
              className="inline-block"
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: motionDuration.slow, ease: motionEase, delay: delay + index * 0.035 }}
            >
              {word}
            </m.span>
          </span>
        ),
      )}
    </span>
  )
}
