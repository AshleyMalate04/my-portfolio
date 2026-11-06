import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { homeFixture } from '../test/fixtures'
import { mockApi } from '../test/http'
import { renderApp } from '../test/render'
import { THEME_STORAGE_KEY } from './theme'

const toggleName = /Mudar para o tema (escuro|claro)/

describe('theme switcher', () => {
  it('toggles between light and dark on click and persists the choice', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })
    const user = userEvent.setup()

    renderApp('/')
    await screen.findByRole('heading', { level: 1 })
    const initial = document.documentElement.dataset.theme
    const flipped = initial === 'dark' ? 'light' : 'dark'

    await user.click(screen.getByRole('button', { name: toggleName }))
    expect(document.documentElement.dataset.theme).toBe(flipped)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(flipped)

    await user.click(screen.getByRole('button', { name: toggleName }))
    expect(document.documentElement.dataset.theme).toBe(initial)
  })

  it('keeps the same button on the public site and the backoffice login', async () => {
    mockApi({ 'GET /home': { data: homeFixture() } })

    const publicView = renderApp('/')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: toggleName })).toBeInTheDocument()
    publicView.unmount()

    renderApp('/admin/login')
    expect(await screen.findByRole('heading', { name: 'Iniciar sessão' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: toggleName })).toBeInTheDocument()
  })
})
