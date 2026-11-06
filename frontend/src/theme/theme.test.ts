import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, isTheme, readTheme, THEME_STORAGE_KEY, writeTheme } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  })

  it('accepts only light and dark', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('system')).toBe(false)
  })

  it('reads the stored theme and ignores invalid values', () => {
    writeTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(readTheme()).toBe('dark')

    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    expect(['light', 'dark']).toContain(readTheme())
  })

  it('applies the theme on the document root', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
