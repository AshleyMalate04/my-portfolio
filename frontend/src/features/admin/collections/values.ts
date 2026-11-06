import { listInput, listPayload, nullable, nullableId, translatedInput, type TranslatedInput } from '../forms/payload'
import type { AdminRecord, Translated } from '../types'
import type { CollectionField } from './types'

export type FormValues = Record<string, unknown>

/** Registo da API → valores do formulário (traduções como {pt, en}, listas como texto, null → ''). */
export function toFormValues(
  fields: CollectionField[],
  record: AdminRecord | null,
  defaults: FormValues = {},
): FormValues {
  const values: FormValues = {}

  for (const field of fields) {
    const raw = record ? record[field.name] : defaults[field.name]

    switch (field.type) {
      case 'translatable':
      case 'translatable-text':
        values[field.name] = translatedInput(raw as Translated)
        break
      case 'translatable-list':
        values[field.name] = listInput(raw as Translated<string[]>)
        break
      case 'switch':
        values[field.name] = Boolean(raw)
        break
      case 'media':
        values[field.name] = raw ?? null
        break
      default:
        values[field.name] = raw === null || raw === undefined ? '' : String(raw)
    }
  }

  return values
}

/** Valores do formulário → corpo do pedido (texto vazio → null, ids numéricos, listas separadas). */
export function toPayload(fields: CollectionField[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const field of fields) {
    const value = values[field.name]

    switch (field.type) {
      case 'translatable':
      case 'translatable-text': {
        const input = value as TranslatedInput
        payload[field.name] = { pt: input.pt.trim(), en: input.en.trim() }
        break
      }
      case 'translatable-list':
        payload[field.name] = listPayload(value as TranslatedInput)
        break
      case 'switch':
        payload[field.name] = Boolean(value)
        break
      case 'media':
        payload[field.name] = nullableId(value as number | null)
        break
      case 'select': {
        const numeric = field.optionsFrom !== undefined || field.options?.some((o) => typeof o.value === 'number')
        payload[field.name] = numeric ? nullableId(value as string) : nullable(value as string)
        break
      }
      default:
        payload[field.name] = nullable(value as string)
    }
  }

  return payload
}

/** Nomes dos campos editáveis (para associar erros de validação do servidor). */
export function fieldNames(fields: CollectionField[]): string[] {
  return fields.flatMap((field) =>
    field.type.startsWith('translatable') ? [`${field.name}.pt`, `${field.name}.en`, field.name] : [field.name],
  )
}

/** Primeiro texto disponível de um valor traduzível. */
export function pt(value: unknown): string {
  const translated = value as Translated
  return translated?.pt ?? translated?.en ?? ''
}
