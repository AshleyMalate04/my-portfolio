import { Moon, Sun } from 'lucide-react'
import { useLocale } from '../i18n/context'
import { useTheme } from './context'

/** Botão que alterna entre o tema claro e o escuro ao clicar. */
export function ThemeSwitcher() {
  const { theme, toggle } = useTheme()
  const { t } = useLocale()
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-11 items-center justify-center rounded-pill text-ink transition-colors duration-fast hover:bg-ink/5"
    >
      <span className="sr-only">{theme === 'dark' ? t.theme.toLight : t.theme.toDark}</span>
      <Icon aria-hidden="true" className="size-5" />
    </button>
  )
}
