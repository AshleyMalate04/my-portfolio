import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockApi } from '../../test/http'
import { renderApp } from '../../test/render'
import type { DashboardSummary } from './types'

const admin = { id: 1, name: 'Ashley Malate', email: 'ashley@example.com', last_login_at: null }

const summary: DashboardSummary = {
  projects: { published: 2, draft: 4 },
  skills: { total: 16, published: 16 },
  services: { total: 9, published: 0 },
  testimonials: { pending: 0 },
  media: { total: 5 },
  recent_changes: [{ type: 'project', id: 3, label: 'SISAEP-UPM', updated_at: '2026-10-29T09:00:00Z' }],
}

const page = <T,>(data: T[]) => ({ data, meta: { current_page: 1, last_page: 1, per_page: 50, total: data.length } })

/** Rotas comuns a qualquer página autenticada. */
function session(extra: Record<string, unknown> = {}) {
  return mockApi({
    'GET /admin/auth/me': { data: admin },
    'GET /admin/dashboard/summary': { data: summary },
    ...extra,
  })
}

describe('back office', () => {
  it('logs in and lands on the dashboard with real totals', async () => {
    let loggedIn = false
    mockApi({
      'GET /admin/auth/me': () =>
        loggedIn ? jsonResponse({ data: admin }) : jsonResponse({ message: 'Sessão expirada.' }, 401),
      'GET /admin/auth/options': { data: { password_reset: false } },
      'POST /admin/auth/login': (init: RequestInit) => {
        const body = JSON.parse(String(init.body))
        if (body.password !== 'Correcta#2026') {
          return jsonResponse(
            { message: 'Erro', errors: { email: ['As credenciais indicadas não são válidas.'] } },
            422,
          )
        }
        loggedIn = true
        return jsonResponse({ data: admin })
      },
      'GET /admin/dashboard/summary': { data: summary },
    })

    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Iniciar sessão' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Esqueci-me/ })).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Email'), 'ashley@example.com')
    await userEvent.type(screen.getByLabelText('Palavra-passe'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('As credenciais indicadas não são válidas.')

    await userEvent.clear(screen.getByLabelText('Palavra-passe'))
    await userEvent.type(screen.getByLabelText('Palavra-passe'), 'Correcta#2026')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Olá, Ashley.' })).toBeInTheDocument()
    expect((await screen.findByText('Projectos publicados')).nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Ficheiros na biblioteca').nextElementSibling).toHaveTextContent('5')
    expect(screen.getByText('SISAEP-UPM')).toBeInTheDocument()
    // Já não há caixa de entrada nem mensagens no menu.
    expect(screen.queryByRole('link', { name: /Mensagens/ })).not.toBeInTheDocument()
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })

  it('redirects to login with a notice when the session expires', async () => {
    let expired = false
    session({
      'GET /admin/auth/me': () =>
        expired ? jsonResponse({ message: 'Sessão expirada.' }, 401) : jsonResponse({ data: admin }),
      'GET /admin/services': () =>
        expired ? jsonResponse({ message: 'Sessão expirada.' }, 401) : jsonResponse(page([])),
      'GET /admin/auth/options': { data: { password_reset: true } },
    })
    const { router } = renderApp('/admin/servicos')
    expect(await screen.findByRole('heading', { name: 'Serviços' })).toBeInTheDocument()

    expired = true
    await router.navigate('/admin/servicos?refresh=1')
    await userEvent.type(screen.getByRole('searchbox'), 'x')

    expect(await screen.findByText(/A sessão expirou/, {}, { timeout: 8000 })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Esqueci-me da palavra-passe' })).toBeInTheDocument()
  })

  it('manages a collection: publish toggle, create with server validation, delete with confirmation', async () => {
    const calls: { method: string; path: string; body?: unknown }[] = []
    const record = (init: RequestInit, url: URL) => {
      calls.push({
        method: init.method ?? 'GET',
        path: url.pathname,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      })
    }
    session({
      'GET /admin/services': page([
        { id: 5, slug: 'apis', title: { pt: 'APIs e backend' }, summary: null, is_published: false },
      ]),
      'PATCH /admin/services/5': (init: RequestInit, url: URL) => {
        record(init, url)
        return jsonResponse({ data: { id: 5 }, message: 'Alterações guardadas.' })
      },
      'POST /admin/services': (init: RequestInit, url: URL) => {
        record(init, url)
        const body = JSON.parse(String(init.body))
        return body.slug === 'existente'
          ? jsonResponse(
              { message: 'Erro', errors: { slug: ['O slug já está em uso.'], 'title.pt': ['O campo é obrigatório.'] } },
              422,
            )
          : jsonResponse({ data: { id: 6 }, message: 'Registo criado.' }, 201)
      },
      'DELETE /admin/services/5': (init: RequestInit, url: URL) => {
        record(init, url)
        return jsonResponse({ message: 'Registo eliminado.' })
      },
    })

    renderApp('/admin/servicos')
    expect(await screen.findByRole('switch', { name: 'Oculto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Editar/ })).toHaveTextContent('Editar APIs e backend')

    await userEvent.click(screen.getByRole('switch', { name: 'Oculto' }))
    await waitFor(() =>
      expect(calls).toContainEqual({ method: 'PATCH', path: '/api/v1/admin/services/5', body: { is_published: true } }),
    )

    await userEvent.click(screen.getByRole('button', { name: /Adicionar serviço/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Adicionar serviço' })
    await userEvent.type(within(dialog).getByLabelText(/Identificador/), 'existente')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await within(dialog).findByText('O slug já está em uso.')).toBeInTheDocument()
    expect(within(dialog).getByText('O campo é obrigatório.')).toBeInTheDocument()
    const created = calls.find((call) => call.method === 'POST')!.body as Record<string, unknown>
    expect(created).toMatchObject({ slug: 'existente', title: { pt: '', en: '' }, icon: null, is_published: false })

    // Fechar com alterações pede confirmação.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Descartar' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Adicionar serviço' })).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar APIs e backend' }))
    const confirmDialog = await screen.findByRole('dialog', { name: 'Eliminar serviço?' })
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true))
  })

  it('creates a project with an automatic slug and publishes it', async () => {
    const bodies: Record<string, unknown>[] = []
    session({
      'GET /admin/project-categories': page([{ id: 1, name: { pt: 'Sistemas' }, slug: 'sistemas' }]),
      'GET /admin/technologies': page([
        { id: 10, name: 'Laravel', slug: 'laravel' },
        { id: 11, name: 'React', slug: 'react' },
      ]),
      'POST /admin/projects': (init: RequestInit) => {
        bodies.push(JSON.parse(String(init.body)))
        return jsonResponse(
          {
            data: {
              id: 42,
              slug: 'sistema-de-votacao',
              title: { pt: 'Sistema de votação' },
              publication_status: 'published',
              images: [],
            },
            message: 'Registo criado.',
          },
          201,
        )
      },
      'GET /admin/projects/42': {
        data: {
          id: 42,
          slug: 'sistema-de-votacao',
          title: { pt: 'Sistema de votação' },
          publication_status: 'published',
          images: [],
        },
      },
    })

    const { router } = renderApp('/admin/projectos/novo')
    expect(await screen.findByRole('heading', { name: 'Novo projecto' })).toBeInTheDocument()

    await userEvent.type(screen.getAllByLabelText(/PT/)[0]!, 'Sistema de Votação')
    expect(screen.getByLabelText(/Endereço \(slug\)/)).toHaveValue('sistema-de-votacao')

    await userEvent.click(await screen.findByRole('button', { name: 'React' }))
    await userEvent.click(screen.getByRole('button', { name: 'Laravel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar e publicar' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      slug: 'sistema-de-votacao',
      title: { pt: 'Sistema de Votação', en: '' },
      publication_status: 'published',
      technology_ids: [11, 10],
      demo_url: null,
      features: { pt: [], en: [] },
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/projectos/42'))
  })

  it('warns about usages before deleting a file and then forces the deletion', async () => {
    const deletes: string[] = []
    session({
      'GET /admin/media': page([
        {
          id: 3,
          url: '/storage/media/x.png',
          kind: 'image',
          original_name: 'retrato.png',
          mime_type: 'image/png',
          extension: 'png',
          size: 2048,
          width: 400,
          height: 500,
          alt: null,
          created_at: null,
          updated_at: null,
          usage: [{ type: 'profile', id: 1, field: 'photo', label: 'Ashley' }],
        },
      ]),
      'DELETE /admin/media/3': (_: RequestInit, url: URL) => {
        deletes.push(url.search)
        return new Response(null, { status: 204 })
      },
    })

    renderApp('/admin/ficheiros')
    await userEvent.click(await screen.findByRole('button', { name: /retrato\.png/ }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'retrato.png' })).getByRole('button', { name: 'Eliminar' }),
    )

    const confirmDialog = await screen.findByRole('dialog', { name: 'Eliminar ficheiro?' })
    expect(confirmDialog).toHaveTextContent('Perfil “Ashley” — fotografia')
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar e retirar das utilizações' }))

    await waitFor(() => expect(deletes).toEqual(['?force=1']))
  })
})
