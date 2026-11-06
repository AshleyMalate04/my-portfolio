import { createContext, useContext } from 'react'
import type { Theme } from './theme'

export interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme precisa de um ThemeProvider.')
  return value
}
