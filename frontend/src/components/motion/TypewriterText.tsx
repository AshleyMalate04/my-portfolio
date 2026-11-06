import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { typewriterTiming } from './config'

/**
 * Escreve e, se houver várias frases, substitui-as em ciclo. O texto completo
 * permanece disponível para leitores de ecrã; a animação não é anunciada em loop.
 */
export function TypewriterText({ phrases, className }: { phrases: string[]; className?: string }) {
  const reduce = useReducedMotion()
  const clean = phrases.map((phrase) => phrase.trim()).filter(Boolean)

  if (clean.length === 0) return null

  if (reduce) {
    return <span className={className}>{clean[0]}</span>
  }

  // A chave recomeça a escrita do zero quando as frases mudam (ex.: troca de idioma).
  return <Typing key={clean.join('\u0001')} phrases={clean} className={className} />
}

function Typing({ phrases, className }: { phrases: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[index] ?? ''
    let timer = 0

    if (!deleting && text === current) {
      if (phrases.length === 1) return
      timer = window.setTimeout(() => setDeleting(true), typewriterTiming.holdMs)
    } else if (deleting) {
      if (text.length === 0) {
        timer = window.setTimeout(() => {
          setIndex((value) => (value + 1) % phrases.length)
          setDeleting(false)
        }, typewriterTiming.gapMs)
      } else {
        timer = window.setTimeout(() => setText(text.slice(0, -1)), typewriterTiming.deleteMs)
      }
    } else {
      timer = window.setTimeout(() => setText(current.slice(0, text.length + 1)), typewriterTiming.typeMs)
    }

    return () => window.clearTimeout(timer)
  }, [deleting, index, phrases, text])

  return (
    <span className={className}>
      <span className="sr-only">{phrases.join('. ')}</span>
      <span aria-hidden="true">
        {text}
        <span className="typewriter-caret ml-0.5 inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] bg-accent align-baseline" />
      </span>
    </span>
  )
}
