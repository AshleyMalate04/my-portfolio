import { createContext, useContext } from 'react'
import { defaultLocale, type Locale } from './locales'
import { messages, type Messages } from './messages'

export interface LocaleContextValue {
  locale: Locale
  t: Messages
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  t: messages[defaultLocale],
})

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
