import { vi } from 'vitest'

/** Resposta JSON simulada para testes do cliente HTTP. */
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

/** Substitui fetch por um mock que devolve as respostas por ordem. */
export function mockFetch(...responses: (Response | (() => Response))[]) {
  const queue = [...responses]

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const next = queue.shift()
    if (!next) throw new Error('Pedido fetch inesperado no teste.')
    return typeof next === 'function' ? next() : next
  })
}

type Handler = unknown | ((init: RequestInit, url: URL) => Response)

/**
 * API simulada por rota ("GET /home", "POST /contact"…, caminhos relativos a /api/v1).
 * Valores simples são devolvidos como JSON 200; funções devolvem a resposta. Rotas desconhecidas → 404.
 */
export function mockApi(routes: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname === '/sanctum/csrf-cookie') {
      document.cookie = 'XSRF-TOKEN=test-token; path=/'
      return jsonResponse(null, 204)
    }
    const key = `${init.method ?? 'GET'} ${url.pathname.replace(/^\/api\/v1/, '')}`
    if (!(key in routes)) return jsonResponse({ message: 'O recurso pedido não foi encontrado.' }, 404)
    const handler = routes[key]
    return typeof handler === 'function'
      ? (handler as (i: RequestInit, u: URL) => Response)(init, url)
      : jsonResponse(handler)
  })
}

/** URL e opções do pedido fetch número `index` (falha o teste se não existir). */
export function fetchCall(fetchMock: ReturnType<typeof mockFetch>, index: number): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls[index]
  if (!call) throw new Error(`Não houve pedido fetch na posição ${index}.`)
  return { url: String(call[0]), init: call[1] ?? {} }
}
