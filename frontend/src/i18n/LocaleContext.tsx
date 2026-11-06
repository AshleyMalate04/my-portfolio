import { useEffect, type ReactNode } from 'react'
import { LocaleContext } from './context'
import { htmlLang, type Locale } from './locales'
import { messages } from './messages'

/** O idioma é definido pela rota (raiz = pt, /en = en) e propagado à árvore. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = htmlLang[locale]
  }, [locale])

  return <LocaleContext.Provider value={{ locale, t: messages[locale] }}>{children}</LocaleContext.Provider>
}
