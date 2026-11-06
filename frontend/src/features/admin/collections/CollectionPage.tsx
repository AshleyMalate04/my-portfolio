import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { applyServerErrors } from '../forms/payload'
import type { AdminRecord } from '../types'
import { useConfirm } from '../ui/useConfirm'
import { Dialog } from '../ui/Dialog'
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, SearchInput, Switch } from '../ui/Page'
import { adminButton, cardStyle, inputStyle } from '../ui/styles'
import { useToast } from '../ui/useToast'
import { CollectionFields } from './CollectionForm'
import type { CollectionConfig } from './types'
import { fieldNames, toFormValues, toPayload, type FormValues } from './values'

/**
 * Página genérica de gestão de uma colecção: lista com pesquisa, publicar/ocultar, ordenação
 * (botões subir/descer, acessíveis por teclado), criação/edição em janela e eliminação com confirmação.
 */
export function CollectionPage({ config, embedded = false }: { config: CollectionConfig; embedded?: boolean }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const scopeId = useId()
  const [q, setQ] = useState('')
  const [scopeValue, setScopeValue] = useState('')
  const [editing, setEditing] = useState<AdminRecord | 'new' | null>(null)

  const query = {
    per_page: 100,
    q: q || undefined,
    ...(config.scope && scopeValue ? { [config.scope.param]: scopeValue } : {}),
  }
  const listKey = adminKeys.list(config.resource, query)
  const list = useQuery({ queryKey: listKey, queryFn: () => adminApi.list(config.resource, query) })

  // Chave própria: partilhar a chave da lista principal faria o refresh usar esta função de pedido.
  const scopeResource = config.scope?.resource
  const scopeOptions = useQuery({
    queryKey: [...adminKeys.resource(scopeResource ?? config.resource), 'scope-options'],
    queryFn: () => adminApi.list(scopeResource!, { per_page: 100 }),
    enabled: scopeResource !== undefined,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.resource(config.resource) })
    void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
  }

  const toggle = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      adminApi.update(config.resource, id, { is_published: value }),
    onSuccess: (_, { value }) => {
      toast.success(value ? 'Publicado no site.' : 'Ocultado do site.')
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const reorder = useMutation({
    mutationFn: (ids: number[]) =>
      adminApi.reorder(
        config.resource,
        ids,
        config.scope && scopeValue ? { [config.scope.param]: Number(scopeValue) } : {},
      ),
    onSuccess: () => {
      toast.success('Ordem actualizada.')
      invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
      invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.remove(config.resource, id),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const records = list.data?.data ?? []
  // A ordenação só faz sentido sem pesquisa e, quando há âmbito (ex.: categoria), com um âmbito escolhido.
  const canReorder = config.sortable !== false && !q && (!config.scope || scopeValue !== '')

  const move = (index: number, direction: -1 | 1) => {
    const ids = records.map((record) => record.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    // Actualização optimista da lista, confirmada (ou revertida) pela resposta do servidor.
    queryClient.setQueryData(listKey, { ...list.data!, data: ids.map((id) => records.find((r) => r.id === id)!) })
    reorder.mutate(ids)
  }

  const onDelete = async (record: AdminRecord) => {
    const ok = await confirm({
      title: `Eliminar ${config.singular.toLowerCase()}?`,
      message: (
        <>
          <strong className="text-ink">{config.primary(record)}</strong> será eliminado(a) definitivamente. Esta acção
          não pode ser desfeita.
        </>
      ),
      confirmLabel: 'Eliminar',
      destructive: true,
    })
    if (ok) remove.mutate(record.id)
  }

  const Header = embedded ? EmbeddedHeader : PageHeader

  return (
    <section aria-label={embedded ? config.title : undefined}>
      <Header
        title={config.title}
        description={config.description}
        actions={
          <button type="button" className={adminButton.primary} onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" className="size-4" />
            Adicionar {config.singular.toLowerCase()}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} label={`Pesquisar ${config.title.toLowerCase()}`} />
        {config.scope && (
          <div className="flex items-center gap-2">
            <label htmlFor={scopeId} className="text-sm text-ink-muted">
              {config.scope.label}
            </label>
            <select
              id={scopeId}
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              className={`${inputStyle} w-auto`}
            >
              <option value="">Todas</option>
              {(scopeOptions.data?.data ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {config.scope!.optionLabel(option)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {config.scope && !canReorder && config.sortable !== false && !q && (
        <p className="mb-3 text-xs text-ink-muted">
          Escolha uma {config.scope.label.toLowerCase()} para alterar a ordem.
        </p>
      )}

      {list.isPending ? (
        <LoadingBlock />
      ) : list.isError ? (
        <ErrorBlock message={list.error.message} onRetry={() => void list.refetch()} />
      ) : records.length === 0 ? (
        <EmptyState
          title={q ? 'Nenhum resultado' : `Ainda não há ${config.title.toLowerCase()}`}
          action={
            !q && (
              <button type="button" className={adminButton.secondary} onClick={() => setEditing('new')}>
                <Plus aria-hidden="true" className="size-4" />
                Adicionar
              </button>
            )
          }
        >
          {!q && config.emptyText}
        </EmptyState>
      ) : (
        <ul className={`${cardStyle} divide-y divide-line`}>
          {records.map((record, index) => (
            <li key={record.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              {canReorder && (
                <div className="flex shrink-0 gap-1 sm:flex-col">
                  <button
                    type="button"
                    className={`${adminButton.icon} size-8`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                    <span className="sr-only">{`Subir ${config.primary(record)}`}</span>
                  </button>
                  <button
                    type="button"
                    className={`${adminButton.icon} size-8`}
                    disabled={index === records.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                    <span className="sr-only">{`Descer ${config.primary(record)}`}</span>
                  </button>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {config.primary(record) || <em className="text-ink-muted">Sem título</em>}
                </p>
                {config.secondary && <div className="mt-0.5 text-sm text-ink-muted">{config.secondary(record)}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {config.publishable && (
                  <Switch
                    checked={Boolean(record.is_published)}
                    disabled={toggle.isPending}
                    onChange={(value) => toggle.mutate({ id: record.id, value })}
                    label={record.is_published ? 'Publicado' : 'Oculto'}
                  />
                )}
                <button type="button" className={adminButton.secondary} onClick={() => setEditing(record)}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Editar<span className="sr-only">{` ${config.primary(record)}`}</span>
                </button>
                <button type="button" className={adminButton.dangerGhost} onClick={() => void onDelete(record)}>
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">{`Eliminar ${config.primary(record)}`}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <RecordDialog
          config={config}
          record={editing === 'new' ? null : editing}
          scopeDefault={config.scope && scopeValue ? { [config.scope.param]: scopeValue } : {}}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
    </section>
  )
}

function EmbeddedHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

function RecordDialog({
  config,
  record,
  scopeDefault,
  onClose,
  onSaved,
}: {
  config: CollectionConfig
  record: AdminRecord | null
  scopeDefault: Record<string, unknown>
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const formId = useId()
  const [generalErrors, setGeneralErrors] = useState<string[]>([])
  // Valores iniciais fixados ao abrir a janela (a janela é montada de novo para cada registo).
  const [defaults] = useState(() => toFormValues(config.fields, record, { ...config.defaults, ...scopeDefault }))
  const form = useForm<FormValues>({ defaultValues: defaults })
  const { isDirty } = form.formState

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = toPayload(config.fields, values)
      return record ? adminApi.update(config.resource, record.id, payload) : adminApi.create(config.resource, payload)
    },
    onSuccess: (response) => {
      toast.success(response.message)
      onSaved()
      onClose()
    },
    onError: (error) => setGeneralErrors(applyServerErrors(error, form.setError, fieldNames(config.fields))),
  })

  const requestClose = async () => {
    if (isDirty && !save.isPending) {
      const discard = await confirm({
        title: 'Descartar alterações?',
        message: 'As alterações feitas neste formulário ainda não foram guardadas.',
        confirmLabel: 'Descartar',
        destructive: true,
      })
      if (!discard) return
    }
    onClose()
  }

  return (
    <Dialog
      open
      size="lg"
      title={record ? `Editar ${config.singular.toLowerCase()}` : `Adicionar ${config.singular.toLowerCase()}`}
      onClose={() => void requestClose()}
      footer={
        <>
          {isDirty && (
            <span className="mr-auto self-center text-xs font-medium text-accent-ink">Alterações por guardar</span>
          )}
          <button type="button" className={adminButton.secondary} onClick={() => void requestClose()}>
            Cancelar
          </button>
          <button type="submit" form={formId} className={adminButton.primary} disabled={save.isPending}>
            {save.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          id={formId}
          noValidate
          onSubmit={form.handleSubmit((values) => {
            setGeneralErrors([])
            save.mutate(values)
          })}
        >
          {generalErrors.length > 0 && (
            <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              {generalErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
          <CollectionFields fields={config.fields} record={record} />
        </form>
      </FormProvider>
    </Dialog>
  )
}
