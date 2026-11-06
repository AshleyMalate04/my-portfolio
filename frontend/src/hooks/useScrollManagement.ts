import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/**
 * Comportamento de scroll de um site com âncoras:
 * - com #âncora, desloca até à secção (esperando que o conteúdo da API seja renderizado);
 * - noutra página, volta ao topo e move o foco para o conteúdo principal (leitores de ecrã).
 */
export function useScrollManagement(mainId: string) {
  const { pathname, hash } = useLocation()
  const firstRender = useRef(true)

  useEffect(() => {
    const isFirst = firstRender.current
    firstRender.current = false

    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      let attempts = 0
      let frame = 0

      const tryScroll = () => {
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ behavior: isFirst ? 'auto' : 'smooth', block: 'start' })
          return
        }
        if (attempts++ < 60) frame = requestAnimationFrame(tryScroll)
      }

      tryScroll()
      return () => cancelAnimationFrame(frame)
    }

    if (!isFirst) {
      window.scrollTo({ top: 0 })
      document.getElementById(mainId)?.focus({ preventScroll: true })
    }
  }, [pathname, hash, mainId])
}
