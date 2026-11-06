/**
 * Configuração validada a partir das variáveis VITE_*.
 * Validação manual (sem Zod) para não incluir a biblioteca no bundle inicial.
 */
function readUrl(name: 'VITE_API_URL' | 'VITE_SITE_URL'): string {
  const raw = import.meta.env[name]
  const value = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : ''

  if (value !== '' && !URL.canParse(value)) {
    throw new Error(`Configuração do frontend inválida: ${name} tem de ser um URL absoluto ou vazio.`)
  }

  return value
}

const apiOrigin = readUrl('VITE_API_URL')

export const env = {
  apiBaseUrl: `${apiOrigin}/api/v1`,
  csrfCookieUrl: `${apiOrigin}/sanctum/csrf-cookie`,
  siteUrl: readUrl('VITE_SITE_URL'),
} as const
