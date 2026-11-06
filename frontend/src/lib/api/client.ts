import { env } from '../../config/env'
import type { Locale } from '../../i18n/locales'

/** Erros de validação no formato do Laravel: { campo: [mensagens] }. */
export type ValidationErrors = Record<string, string[]>

export type ApiErrorKind =
  'network' | 'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'rate_limited' | 'csrf' | 'server'

export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly errors: ValidationErrors
  /** Caminho da API que originou o erro (ex.: /admin/projects). */
  readonly path: string | undefined

  constructor(message: string, status: number, errors: ValidationErrors = {}, path?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.path = path
    this.kind = kindFor(status)
  }

  /** Primeira mensagem de erro de um campo, útil para formulários. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

function kindFor(status: number): ApiErrorKind {
  switch (status) {
    case 0:
      return 'network'
    case 401:
      return 'unauthenticated'
    case 403:
      return 'forbidden'
    case 404:
      return 'not_found'
    case 419:
      return 'csrf'
    case 422:
      return 'validation'
    case 429:
      return 'rate_limited'
    default:
      return 'server'
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  locale?: Locale
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  /**
   * Leitura pública sem sessão: não envia cookies nem Referer, pelo que o Sanctum trata o pedido como
   * stateless (não cria sessão por visitante) e a resposta pode ser guardada em cache HTTP.
   */
  stateless?: boolean
}

const XSRF_COOKIE = 'XSRF-TOKEN'

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

let csrfRequest: Promise<void> | null = null

/** Obtém o cookie XSRF-TOKEN do Sanctum (uma única vez em simultâneo). */
async function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && readCookie(XSRF_COOKIE)) return

  csrfRequest ??= fetch(env.csrfCookieUrl, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (!response.ok) throw new ApiError('Não foi possível iniciar a protecção CSRF.', response.status)
    })
    .finally(() => {
      csrfRequest = null
    })

  return csrfRequest
}

function buildUrl(path: string, options: RequestOptions): string {
  const params = new URLSearchParams()

  if (options.locale) params.set('lang', options.locale)

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) params.set(key, String(value))
  }

  const search = params.toString()
  return `${env.apiBaseUrl}${path}${search ? `?${search}` : ''}`
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }

  if (method !== 'GET') {
    await ensureCsrfCookie()
    const token = readCookie(XSRF_COOKIE)
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  try {
    return await fetch(buildUrl(path, options), {
      method,
      headers,
      body,
      credentials: options.stateless ? 'omit' : 'include',
      referrerPolicy: options.stateless ? 'no-referrer' : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Sem ligação ao servidor. Verifique a sua ligação à Internet e tente novamente.', 0)
  }
}

/**
 * Único ponto de comunicação com a API Laravel. Trata CSRF, idioma, cookies de sessão
 * e converte respostas de erro em ApiError.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options)

  // Token CSRF expirado (419): renova o cookie e repete o pedido uma única vez.
  if (response.status === 419 && (options.method ?? 'GET') !== 'GET') {
    await ensureCsrfCookie(true)
    response = await send(path, options)
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const data = (payload ?? {}) as { message?: unknown; errors?: unknown }
    const message = typeof data.message === 'string' ? data.message : 'Ocorreu um erro inesperado. Tente novamente.'
    const errors = isValidationErrors(data.errors) ? data.errors : {}
    throw new ApiError(message, response.status, errors, path)
  }

  return payload as T
}

function isValidationErrors(value: unknown): value is ValidationErrors {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((messages) => Array.isArray(messages) && messages.every((m) => typeof m === 'string'))
  )
}
