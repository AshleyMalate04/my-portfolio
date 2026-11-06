import { describe, expect, it } from 'vitest'
import { localizedPath } from './locales'
import { messages } from './messages'

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

describe('i18n', () => {
  it('builds localised paths with Portuguese at the root', () => {
    expect(localizedPath('pt')).toBe('/')
    expect(localizedPath('pt', '/projectos')).toBe('/projectos')
    expect(localizedPath('en')).toBe('/en')
    expect(localizedPath('en', 'projectos/')).toBe('/en/projectos')
  })

  it('keeps the same interface keys in every language', () => {
    expect(keysOf(messages.en)).toEqual(keysOf(messages.pt))
  })
})
