import type { ReactNode } from 'react'
import type { AdminResource } from '../../../lib/api/admin'
import type { AdminRecord } from '../types'

export type CollectionFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'email'
  | 'date'
  | 'translatable'
  | 'translatable-text'
  | 'translatable-list'
  | 'select'
  | 'switch'
  | 'media'

export interface CollectionField {
  name: string
  label: string
  type: CollectionFieldType
  required?: boolean
  help?: string
  maxLength?: number
  rows?: number
  /** Ocupa a largura toda em ecrãs largos (por omissão, campos simples ficam em duas colunas). */
  full?: boolean
  options?: { value: string | number; label: string }[]
  /** Opções carregadas de outro recurso (ex.: categoria de uma competência). */
  optionsFrom?: { resource: AdminResource; label: (record: AdminRecord) => string }
  emptyLabel?: string
  kind?: 'image' | 'document'
  /** Nome da relação com o ficheiro actual (para a pré-visualização), ex.: "document". */
  mediaRelation?: string
}

export interface CollectionConfig {
  resource: AdminResource
  title: string
  singular: string
  description?: ReactNode
  fields: CollectionField[]
  primary: (record: AdminRecord) => string
  secondary?: (record: AdminRecord) => ReactNode
  /** Mostra o interruptor publicar/ocultar (campo is_published). */
  publishable?: boolean
  sortable?: boolean
  /** Filtro que também delimita a ordenação (ex.: competências de uma categoria). */
  scope?: { param: string; label: string; resource: AdminResource; optionLabel: (record: AdminRecord) => string }
  defaults?: Record<string, unknown>
  emptyText?: ReactNode
}
