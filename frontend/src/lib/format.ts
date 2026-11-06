import type { Locale } from '../i18n/locales'

// pt-MZ não tem formatos curtos de mês no Intl; pt-PT segue as mesmas convenções.
const dateLocale: Record<Locale, string> = { pt: 'pt-PT', en: 'en-GB' }

/** Converte "AAAA-MM-DD" em data local sem desvios de fuso horário. */
function parseDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "mar. 2025" / "Mar 2025". Devolve null quando não há data (nunca inventa datas). */
export function formatMonthYear(value: string | null, locale: Locale): string | null {
  if (!value) return null
  const date = parseDate(value)
  // Mês e ano formatados em separado: alguns motores ICU devolvem "03/2025" para pt com month+year.
  const month = new Intl.DateTimeFormat(dateLocale[locale], { month: 'short' }).format(date)
  return `${month} ${date.getFullYear()}`
}

/**
 * Período "início – fim" usando só as datas disponíveis.
 * Ex.: "mar. 2025 – actualmente", "2024", ou null quando nada é conhecido.
 */
export function formatPeriod(
  start: string | null,
  end: string | null,
  isCurrent: boolean,
  locale: Locale,
  currentLabel: string,
): string | null {
  const from = formatMonthYear(start, locale)
  const to = isCurrent ? currentLabel : formatMonthYear(end, locale)

  if (from && to) return `${from} – ${to}`
  if (from) return from
  if (to && isCurrent) return currentLabel
  return to
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Aceita apenas URLs http(s), mailto e tel: evita esquemas perigosos vindos de conteúdo editável. */
export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

/** Número para ligação wa.me (apenas dígitos). */
export function whatsappUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

/** Iniciais para a composição gráfica quando não há fotografia (ex.: "Ashley Malate" → "AM"). */
export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w))
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}
