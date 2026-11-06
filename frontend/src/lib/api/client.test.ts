import { describe, expect, it } from 'vitest'
import { fetchCall, jsonResponse, mockFetch } from '../../test/http'
import { ApiError, apiRequest } from './client'

describe('apiRequest', () => {
  it('adds the language, JSON headers and credentials to GET requests', async () => {
    const fetch = mockFetch(jsonResponse({ data: { ok: true } }))

    await expect(
      apiRequest('/profile', {
        locale: 'en',
        query: { page: 2, skip: undefined },
      }),
    ).resolves.toEqual({
      data: { ok: true },
    })

    const { url, init } = fetchCall(fetch, 0)
    expect(url).toBe('/api/v1/profile?lang=en&page=2')
    expect(init.credentials).toBe('include')
    expect(init.headers).toMatchObject({ Accept: 'application/json' })
  })

  it('fetches the Sanctum CSRF cookie and sends X-XSRF-TOKEN on mutations', async () => {
    const fetch = mockFetch(
      () => {
        document.cookie = 'XSRF-TOKEN=abc%3D%3D; path=/'
        return jsonResponse(null, 204)
      },
      jsonResponse({ message: 'ok' }, 201),
    )

    await apiRequest('/contact', { method: 'POST', body: { name: 'Ana' } })

    expect(fetchCall(fetch, 0).url).toBe('/sanctum/csrf-cookie')
    const { init } = fetchCall(fetch, 1)
    expect(init.headers).toMatchObject({
      'X-XSRF-TOKEN': 'abc==',
      'Content-Type': 'application/json',
    })
    expect(init.body).toBe('{"name":"Ana"}')
  })

  it('renews the CSRF cookie and retries once when the token expired (419)', async () => {
    document.cookie = 'XSRF-TOKEN=velho; path=/'
    const fetch = mockFetch(
      jsonResponse({ message: 'CSRF token mismatch.' }, 419),
      jsonResponse(null, 204),
      jsonResponse({ message: 'ok' }, 201),
    )

    await expect(apiRequest('/contact', { method: 'POST', body: {} })).resolves.toEqual({ message: 'ok' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('converts Laravel validation responses into ApiError with field errors', async () => {
    mockFetch(
      jsonResponse(
        {
          message: 'Dados inválidos.',
          errors: { email: ['O campo email é obrigatório.'] },
        },
        422,
      ),
    )

    const error = await apiRequest('/profile').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).kind).toBe('validation')
    expect((error as ApiError).fieldError('email')).toBe('O campo email é obrigatório.')
  })

  it('reports network failures without exposing technical details', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    const error = (await apiRequest('/profile').catch((e: unknown) => e)) as ApiError

    expect(error.kind).toBe('network')
    expect(error.status).toBe(0)
  })

  it('handles non-JSON error bodies and empty 204 responses', async () => {
    mockFetch(new Response('<html>Erro</html>', { status: 500 }), jsonResponse(null, 204))

    const error = (await apiRequest('/profile').catch((e: unknown) => e)) as ApiError
    expect(error.kind).toBe('server')
    expect(error.message).toBe('Ocorreu um erro inesperado. Tente novamente.')

    document.cookie = 'XSRF-TOKEN=t; path=/'
    await expect(apiRequest('/admin/media/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
