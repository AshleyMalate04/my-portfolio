export const THEME_STORAGE_KEY = 'ashley-appearance'

export type Theme = 'light' | 'dark'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Tema guardado; na primeira visita, o do sistema. */
export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // Navegação privada ou armazenamento indisponível.
  }
  return systemPrefersDark() ? 'dark' : 'light'
}

export function writeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Sem persistência, a escolha aplica-se só a esta sessão.
  }
}

const THEME_COLOR = { light: '#F7F1E8', dark: '#241521' } as const

/** Aplica o tema no elemento raiz, antes ou depois da hidratação. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  root.classList.toggle('dark', theme === 'dark')

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[theme])
}
