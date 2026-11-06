import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '../theme/ThemeProvider'

/**
 * Configuração global de tema e animação, partilhada pela aplicação e pelos testes.
 * LazyMotion + domAnimation carrega só as funcionalidades usadas (bundle menor);
 * reducedMotion="user" segue a preferência do sistema operativo.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  )
}
