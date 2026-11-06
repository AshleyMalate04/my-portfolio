import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '../../../lib/api/client'
import type { Translated } from '../types'

/** Estrutura usada nos formulários para campos traduzíveis: sempre {pt, en} em texto. */
export type TranslatedInput = { pt: string; en: string }

export function translatedInput(value: Translated | undefined): TranslatedInput {
  return { pt: value?.pt ?? '', en: value?.en ?? '' }
}

/** Listas traduzíveis são editadas como texto com um item por linha. */
export function listInput(value: Translated<string[]> | undefined): TranslatedInput {
  return { pt: (value?.pt ?? []).join('\n'), en: (value?.en ?? []).join('\n') }
}

export function listPayload(value: TranslatedInput): Record<string, string[]> {
  const split = (text: string) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  return { pt: split(value.pt), en: split(value.en) }
}

/** Texto vazio → null (o backend distingue "sem valor" de texto vazio). */
export function nullable(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

export function nullableId(value: string | number | null | undefined): number | null {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/**
 * Aplica os erros de validação do Laravel aos campos do formulário (as chaves "title.pt" correspondem
 * directamente aos nomes dos campos). Devolve as mensagens que não pertencem a nenhum campo visível.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: string[],
): string[] {
  if (!(error instanceof ApiError) || error.kind !== 'validation') {
    return [error instanceof Error ? error.message : 'Ocorreu um erro inesperado.']
  }

  const unmatched: string[] = []
  let focused = false

  for (const [key, messages] of Object.entries(error.errors)) {
    const message = messages[0] ?? ''
    // "features.pt.2" → o campo editável é "features.pt".
    const field = fields.find((name) => key === name || key.startsWith(`${name}.`))

    if (field) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !focused })
      focused = true
    } else {
      unmatched.push(message)
    }
  }

  return unmatched
}
