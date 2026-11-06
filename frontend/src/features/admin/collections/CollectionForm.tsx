import { useQuery } from '@tanstack/react-query'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { SelectField, SwitchField, TextField, TranslatableField } from '../forms/fields'
import { MediaField } from '../media/MediaField'
import type { AdminRecord, MediaRef } from '../types'
import type { CollectionField } from './types'

/** Renderiza os campos definidos na configuração de uma colecção (dentro de um FormProvider). */
export function CollectionFields({ fields, record }: { fields: CollectionField[]; record: AdminRecord | null }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={isWide(field) ? 'md:col-span-2' : ''}>
          <FieldControl field={field} record={record} />
        </div>
      ))}
    </div>
  )
}

function isWide(field: CollectionField): boolean {
  return field.full || field.type.startsWith('translatable') || field.type === 'textarea' || field.type === 'media'
}

function FieldControl({ field, record }: { field: CollectionField; record: AdminRecord | null }) {
  switch (field.type) {
    case 'translatable':
    case 'translatable-text':
    case 'translatable-list':
      return (
        <TranslatableField
          name={field.name}
          label={field.label}
          help={field.help}
          required={field.required}
          maxLength={field.maxLength}
          multiline={field.type === 'translatable-text'}
          list={field.type === 'translatable-list'}
          rows={field.rows}
        />
      )
    case 'switch':
      return <SwitchField name={field.name} label={field.label} help={field.help} />
    case 'select':
      return field.optionsFrom ? (
        <RemoteSelect field={field} />
      ) : (
        <SelectField
          name={field.name}
          label={field.label}
          help={field.help}
          required={field.required}
          options={field.options ?? []}
          emptyLabel={field.emptyLabel}
        />
      )
    case 'media':
      return (
        <MediaField
          name={field.name}
          label={field.label}
          kind={field.kind ?? 'image'}
          help={field.help}
          initial={
            field.mediaRelation ? ((record?.[field.mediaRelation] as MediaRef | null | undefined) ?? null) : null
          }
        />
      )
    default:
      return (
        <TextField
          name={field.name}
          label={field.label}
          help={field.help}
          required={field.required}
          maxLength={field.maxLength}
          type={field.type === 'textarea' ? 'text' : field.type}
          multiline={field.type === 'textarea'}
          rows={field.rows}
        />
      )
  }
}

function RemoteSelect({ field }: { field: CollectionField }) {
  const source = field.optionsFrom!
  const options = useQuery({
    queryKey: adminKeys.list(source.resource, { per_page: 100 }),
    queryFn: () => adminApi.list(source.resource, { per_page: 100 }),
  })

  return (
    <SelectField
      name={field.name}
      label={field.label}
      help={options.isError ? 'Não foi possível carregar as opções.' : field.help}
      required={field.required}
      emptyLabel={field.emptyLabel ?? (options.isPending ? 'A carregar…' : undefined)}
      options={(options.data?.data ?? []).map((record) => ({ value: record.id, label: source.label(record) }))}
    />
  )
}
