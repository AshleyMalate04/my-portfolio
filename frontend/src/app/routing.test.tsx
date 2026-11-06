import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { homeFixture } from '../test/fixtures'
import { jsonResponse, mockApi } from '../test/http'
import { renderApp } from '../test/render'

describe('routing', () => {
  it('serves English content under /en and sets the document language', async () => {
    const api = mockApi({ 'GET /home': { data: homeFixture() } })

    renderApp('/en')

    expect(await screen.findByRole('link', { name: 'Skip to content' })).toBeInTheDocument()
    expect(String(api.mock.calls[0]?.[0])).toBe('/api/v1/home?lang=en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('shows a localised 404 page for unknown addresses', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })

    renderApp('/en/nao-existe')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('redirects guests from the back office to the login route', async () => {
    mockApi({ 'GET /admin/auth/me': () => jsonResponse({ message: 'Sessão inexistente ou expirada.' }, 401) })

    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Iniciar sessão' })).toBeInTheDocument()
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })
})
