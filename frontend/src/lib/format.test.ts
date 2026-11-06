import { describe, expect, it } from 'vitest'
import { paths, translatePath } from '../routes/paths'
import { formatMonthYear, formatPeriod, initialsOf, isSafeUrl, whatsappUrl } from './format'

describe('format helpers', () => {
  it('formats dates only when they exist', () => {
    expect(formatMonthYear('2025-03-01', 'pt')).toBe('mar. 2025')
    expect(formatMonthYear('2025-03-01', 'en')).toBe('Mar 2025')
    expect(formatMonthYear(null, 'pt')).toBeNull()
    expect(formatPeriod('2025-01-01', '2025-06-30', false, 'pt', 'actualmente')).toBe('jan. 2025 – jun. 2025')
    expect(formatPeriod('2025-01-01', null, true, 'pt', 'actualmente')).toBe('jan. 2025 – actualmente')
    expect(formatPeriod(null, null, true, 'pt', 'actualmente')).toBe('actualmente')
    expect(formatPeriod(null, null, false, 'pt', 'actualmente')).toBeNull()
  })

  it('accepts only safe URL schemes', () => {
    expect(isSafeUrl('https://github.com/x')).toBe(true)
    expect(isSafeUrl('mailto:a@b.co')).toBe(true)
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('data:text/html,x')).toBe(false)
    expect(isSafeUrl('')).toBe(false)
    expect(isSafeUrl(null)).toBe(false)
  })

  it('builds WhatsApp links and initials', () => {
    expect(whatsappUrl('+258 84 000 0000')).toBe('https://wa.me/258840000000')
    expect(whatsappUrl('123')).toBeNull()
    expect(initialsOf('Ashley da Amena Mario Malate')).toBe('AM')
  })
})

describe('localised paths', () => {
  it('maps pages between languages', () => {
    expect(paths.project('pt', 'sisaep-upm')).toBe('/projectos/sisaep-upm')
    expect(paths.project('en', 'sisaep-upm')).toBe('/en/projects/sisaep-upm')
    expect(translatePath('/projectos/sisaep-upm', 'pt', 'en')).toBe('/en/projects/sisaep-upm')
    expect(translatePath('/en/projects', 'en', 'pt')).toBe('/projectos')
    expect(translatePath('/en', 'en', 'pt')).toBe('/')
    expect(paths.section('en', 'contact')).toBe('/en#contact')
  })
})
