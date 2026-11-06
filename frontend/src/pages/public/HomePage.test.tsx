import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { homeFixture, projectSummaryFixture } from '../../test/fixtures'
import { fetchCall, jsonResponse, mockApi } from '../../test/http'
import { renderApp } from '../../test/render'

describe('home page', () => {
  it('renders the hero and sections from a single /home request', async () => {
    const api = mockApi({
      'GET /home': {
        data: homeFixture({
          skills: [
            {
              slug: 'frontend',
              name: 'Frontend',
              description: null,
              skills: [{ name: 'React', description: null, technology: null }],
            },
          ],
          process_steps: [{ id: 1, title: 'Compreender o problema', description: null }],
        }),
      },
    })

    renderApp('/')

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Ashley.da Amena Mario Malate')
    expect(screen.getAllByText('Estudante de Informática e desenvolvedora de software').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'O que uso no dia-a-dia.' })).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Compreender o problema')).toBeInTheDocument()

    expect(fetchCall(api, 0).url).toBe('/api/v1/home?lang=pt')
    // Leitura pública sem sessão: sem cookies nem Referer.
    expect(fetchCall(api, 0).init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
  })

  it('hides sections and navigation entries without published content', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })

    renderApp('/')
    await screen.findByRole('heading', { level: 1 })

    const nav = screen.getAllByRole('navigation', { name: 'Navegação principal' })[0]!
    expect(within(nav).queryByRole('link', { name: 'Serviços' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Competências' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Contacto' })).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Palavras de quem já trabalhou comigo.' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Como posso ajudar.' })).not.toBeInTheDocument()
    // Sem projectos publicados: a secção não aparece e não há botão para uma secção vazia.
    expect(screen.queryByRole('heading', { name: 'O que já construí.' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Projectos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ver projectos/ })).not.toBeInTheDocument()
    // Sem CV configurado, não há ligação de download.
    expect(screen.queryByRole('link', { name: /Descarregar o meu CV/ })).not.toBeInTheDocument()
  })

  it('shows projects, only real links and the CV when configured', async () => {
    mockApi({
      'GET /home': {
        data: homeFixture({
          profile: { ...homeFixture().profile!, cv_url: 'https://example.com/cv.pdf' },
          projects: {
            items: [
              { ...projectSummaryFixture, demo_url: 'https://example.com' },
              {
                ...projectSummaryFixture,
                slug: 'outro',
                title: 'Outro projecto',
                repository_url: 'javascript:alert(1)',
              },
            ],
            total: 2,
          },
        }),
      },
    })

    renderApp('/')

    expect(await screen.findByRole('link', { name: 'SISAEP-UPM' })).toHaveAttribute('href', '/projectos/sisaep-upm')
    expect(screen.getByRole('link', { name: /Ver projectos/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Descarregar o meu CV/ })).toHaveAttribute(
      'href',
      'https://example.com/cv.pdf',
    )
    expect(screen.getAllByRole('link', { name: /Ver online/ })).toHaveLength(1)
    // URLs com esquemas perigosos nunca são renderizadas.
    expect(screen.queryByRole('link', { name: /Código/ })).not.toBeInTheDocument()
    expect(screen.getAllByText('Em construção').length).toBeGreaterThan(0)
  })

  it('shows two projects on the home page and a link to the rest', async () => {
    mockApi({
      'GET /home': {
        data: homeFixture({
          projects: {
            items: [
              projectSummaryFixture,
              { ...projectSummaryFixture, slug: 'confylar', title: 'ConfyLar' },
              { ...projectSummaryFixture, slug: 'terceiro', title: 'Terceiro' },
            ],
            total: 3,
          },
        }),
      },
    })

    renderApp('/')

    expect(await screen.findByRole('link', { name: 'SISAEP-UPM' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ConfyLar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Terceiro' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todos os projectos/ })).toHaveAttribute('href', '/projectos')
  })

  it('shows availability only when the API provides it', async () => {
    mockApi({
      'GET /home': {
        data: homeFixture({
          profile: { ...homeFixture().profile!, availability: { status: 'open_to_opportunities', note: null } },
        }),
      },
    })

    renderApp('/')

    expect(await screen.findByText('Aberta a oportunidades')).toBeInTheDocument()
  })

  it('shows an error state with a working retry', async () => {
    let calls = 0
    mockApi({
      'GET /home': () =>
        ++calls === 1 ? jsonResponse({ message: 'Erro.' }, 500) : jsonResponse({ data: homeFixture() }),
    })

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo correu mal ao carregar esta página.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('opens and closes the mobile menu accessibly', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })
    renderApp('/')
    await screen.findByRole('heading', { level: 1 })

    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName('Fechar menu')

    await userEvent.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('ends with the contact headline, direct channels and CV — no form and no footer', async () => {
    mockApi({
      'GET /home': {
        data: homeFixture({
          settings: { ...homeFixture().settings, contact_headline: 'Cada bom sistema começa com uma boa conversa.' },
          profile: {
            ...homeFixture().profile!,
            whatsapp: '+258 84 000 0000',
            public_email: 'ashley@example.com',
            cv_url: 'https://example.com/cv.pdf',
          },
          social_links: [
            { platform: 'github', label: null, url: 'https://github.com/exemplo' },
            { platform: 'linkedin', label: null, url: 'https://www.linkedin.com/in/exemplo/' },
          ],
        }),
      },
    })

    renderApp('/')

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Cada bom sistema começa com uma boa conversa.' }),
    ).toBeInTheDocument()
    const links = screen.getAllByRole('link').map((link) => link.textContent)
    const order = ['WhatsApp', 'LinkedIn', 'GitHub', 'Email'].map((label) =>
      links.findIndex((text) => text?.startsWith(label)),
    )
    expect(order.every((position) => position >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)

    expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/258840000000')
    expect(screen.getByRole('link', { name: /LinkedIn/ })).toHaveTextContent('linkedin.com/in/exemplo')
    expect(screen.getByRole('link', { name: /Email/ })).toHaveAttribute('href', 'mailto:ashley@example.com')
    expect(screen.getByRole('link', { name: /Descarregar o meu CV/ })).toHaveAttribute('download')

    expect(screen.queryByRole('button', { name: /Enviar mensagem/ })).not.toBeInTheDocument()
    expect(document.querySelector('footer')).toBeNull()
  })
})
