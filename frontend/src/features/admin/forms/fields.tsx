import { useId, type ReactNode } from 'react'
import { useController, useFormContext, type FieldValues, type Path } from 'react-hook-form'
import { Switch } from '../ui/Page'
import { inputStyle } from '../ui/styles'

/** Lê a mensagem de erro de um campo aninhado (ex.: "title.pt"). */
function errorAt(errors: Record<string, unknown>, name: string): string | undefined {
  const value = name
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], errors)
  const message = (value as { message?: unknown } | undefined)?.message
  return typeof message === 'string' ? message : undefined
}

interface BaseProps {
  name: string
  label: string
  help?: ReactNode
  required?: boolean
}

/** Moldura comum: label associado, ajuda e erro ligados por aria-describedby. */
function FieldShell({
  id,
  label,
  help,
  error,
  required,
  children,
}: {
  id: string
  label: string
  help?: ReactNode
  error?: string
  required?: boolean
  children: (describedBy: string | undefined) => ReactNode
}) {
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {required && <span className="text-xs font-normal text-accent-ink">obrigatório</span>}
      </label>
      {children(describedBy)}
      {help && (
        <p id={helpId} className="mt-1.5 text-xs text-ink-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type InputType = 'text' | 'email' | 'url' | 'date' | 'tel' | 'number'

export function TextField({
  name,
  label,
  help,
  required,
  type = 'text',
  maxLength,
  placeholder,
  multiline,
  rows = 4,
}: BaseProps & { type?: InputType; maxLength?: number; placeholder?: string; multiline?: boolean; rows?: number }) {
  const id = useId()
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const error = errorAt(errors, name)

  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required}>
      {(describedBy) =>
        multiline ? (
          <textarea
            id={id}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`${inputStyle} leading-relaxed`}
            {...register(name)}
          />
        ) : (
          <input
            id={id}
            type={type}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={inputStyle}
            {...register(name)}
          />
        )
      }
    </FieldShell>
  )
}

export function SelectField({
  name,
  label,
  help,
  required,
  options,
  emptyLabel,
}: BaseProps & { options: { value: string | number; label: string }[]; emptyLabel?: string }) {
  const id = useId()
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const error = errorAt(errors, name)

  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required}>
      {(describedBy) => (
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputStyle}
          {...register(name)}
        >
          {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}

export function SwitchField<T extends FieldValues>({
  name,
  label,
  help,
}: {
  name: Path<T> | string
  label: string
  help?: ReactNode
}) {
  const { field } = useController({ name })
  const {
    formState: { errors },
  } = useFormContext()
  const error = errorAt(errors, name)

  return (
    <div>
      <Switch checked={Boolean(field.value)} onChange={field.onChange} label={label} />
      {help && <p className="mt-0.5 text-xs text-ink-muted">{help}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}

/**
 * Campo traduzível: português (principal) e inglês lado a lado.
 * O inglês é opcional — sem tradução, o site em inglês mostra o texto em português.
 */
export function TranslatableField({
  name,
  label,
  help,
  required,
  multiline,
  rows,
  maxLength,
  list,
}: BaseProps & { multiline?: boolean; rows?: number; maxLength?: number; list?: boolean }) {
  const listHelp = list ? 'Um item por linha.' : undefined

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {required && <span className="text-xs font-normal text-accent-ink">obrigatório em PT</span>}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <LocaleInput name={`${name}.pt`} locale="PT" multiline={multiline || list} rows={rows} maxLength={maxLength} />
        <LocaleInput name={`${name}.en`} locale="EN" multiline={multiline || list} rows={rows} maxLength={maxLength} />
      </div>
      {(help || listHelp) && (
        <p className="mt-1.5 text-xs text-ink-muted">{[help, listHelp].filter(Boolean).join(' ')}</p>
      )}
    </fieldset>
  )
}

function LocaleInput({
  name,
  locale,
  multiline,
  rows = 4,
  maxLength,
}: {
  name: string
  locale: 'PT' | 'EN'
  multiline?: boolean
  rows?: number
  maxLength?: number
}) {
  const id = useId()
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const error = errorAt(errors, name)
  const errorId = `${id}-error`

  return (
    <div>
      <div className="relative">
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-2 right-2 rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-muted"
        >
          {locale}
          <span className="sr-only">{locale === 'PT' ? ' (português)' : ' (inglês)'}</span>
        </label>
        {multiline ? (
          <textarea
            id={id}
            rows={rows}
            maxLength={maxLength}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`${inputStyle} pr-12 leading-relaxed`}
            {...register(name)}
          />
        ) : (
          <input
            id={id}
            type="text"
            maxLength={maxLength}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`${inputStyle} pr-12`}
            {...register(name)}
          />
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Secção de formulário com título e descrição, para formulários longos. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="grid gap-6 border-b border-line py-8 first:pt-0 last:border-b-0 lg:grid-cols-[16rem_1fr]">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      <div className="grid min-w-0 gap-5">{children}</div>
    </section>
  )
}
