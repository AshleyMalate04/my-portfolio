export const locales = ['pt', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'pt'

/** O português vive na raiz do site; os restantes idiomas têm prefixo (ex.: /en). */
export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? '' : `/${locale}`
}

export function localizedPath(locale: Locale, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const prefixed = `${localePrefix(locale)}${normalized}`
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, '') : '/'
}

export const htmlLang: Record<Locale, string> = {
  pt: 'pt-MZ',
  en: 'en',
}
