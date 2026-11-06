import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { homeFixture, projectFixture } from '../../test/fixtures'
import { mockApi } from '../../test/http'
import { renderApp } from '../../test/render'

describe('project page', () => {
  it('renders only the sections and links that exist', async () => {
    mockApi({
      'GET /home': { data: homeFixture() },
      'GET /projects/sisaep-upm': { data: { ...projectFixture, demo_url: 'https://example.com' } },
    })

    renderApp('/projectos/sisaep-upm')

    expect(await screen.findByRole('heading', { level: 1, name: 'SISAEP-UPM' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /O problema/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /A solução/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /O objectivo/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Resultados/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Imagens' })).not.toBeInTheDocument()
    expect(screen.getByText('Submissão')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver online/ })).toHaveAttribute('href', 'https://example.com')
    expect(screen.queryByRole('link', { name: /Código/ })).not.toBeInTheDocument()
    // Estado honesto: em construção, nunca "Concluído".
    expect(screen.getAllByText('Em construção').length).toBeGreaterThan(0)
    expect(screen.queryByText('Concluído')).not.toBeInTheDocument()

    expect(document.title).toBe('SISAEP-UPM — Ashley da Amena Mario Malate')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://localhost:3000/projectos/sisaep-upm',
    )
  })

  it('shows a not-found page for drafts or unknown slugs', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })

    renderApp('/projectos/rascunho')

    expect(await screen.findByRole('heading', { level: 1, name: 'Projecto não encontrado' })).toBeInTheDocument()
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })

  it('uses the English path and content language under /en', async () => {
    const api = mockApi({
      'GET /home': { data: homeFixture() },
      'GET /projects/sisaep-upm': { data: projectFixture },
    })

    renderApp('/en/projects/sisaep-upm')

    expect(await screen.findByRole('heading', { name: /The problem/ })).toBeInTheDocument()
    expect(api.mock.calls.some(([url]) => String(url) === '/api/v1/projects/sisaep-upm?lang=en')).toBe(true)
    expect(screen.getByRole('link', { name: 'All projects' })).toHaveAttribute('href', '/en/projects')
  })
})
