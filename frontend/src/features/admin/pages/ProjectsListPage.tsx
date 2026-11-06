import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useId } from 'react'
import { Link, useSearchParams } from 'react-router'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { pt } from '../collections/values'
import { MediaThumb } from '../media/MediaPicker'
import { projectStatusLabels } from '../labels'
import type { AdminProject } from '../types'
import { useConfirm } from '../ui/useConfirm'
import { Badge, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Pagination, SearchInput, Switch } from '../ui/Page'
import { adminButton, cardStyle, inputStyle } from '../ui/styles'
import { useToast } from '../ui/useToast'

export function ProjectsListPage() {
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const statusId = useId()
  const q = params.get('q') ?? ''
  const status = params.get('estado') ?? ''
  const page = Number(params.get('pagina') ?? 1)

  const query = { q: q || undefined, publication_status: status || undefined, page, per_page: 20 }
  const listKey = adminKeys.list('projects', query)
  const list = useQuery({ queryKey: listKey, queryFn: () => adminApi.list<AdminProject>('projects', query) })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next, { replace: true })
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.resource('projects') })
    void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
  }

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => adminApi.update('projects', id, body),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.remove('projects', id),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const reorder = useMutation({
    mutationFn: (ids: number[]) => adminApi.reorder('projects', ids),
    onSuccess: () => toast.success('Ordem actualizada.'),
    onError: (error) => toast.error(error.message),
    onSettled: invalidate,
  })

  const projects = list.data?.data ?? []
  // A ordem manual só se aplica à lista completa (sem pesquisa, filtro ou várias páginas).
  const canReorder = !q && !status && list.data?.meta.last_page === 1

  const move = (index: number, direction: -1 | 1) => {
    const ids = projects.map((project) => project.id)
    const target = index + direction
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    reorder.mutate(ids)
  }

  const onDelete = async (project: AdminProject) => {
    const ok = await confirm({
      title: 'Eliminar projecto?',
      message: (
        <>
          <strong className="text-ink">{pt(project.title)}</strong> será eliminado definitivamente, incluindo a galeria.
          Os ficheiros continuam na biblioteca.
        </>
      ),
      confirmLabel: 'Eliminar projecto',
      destructive: true,
    })
    if (ok) remove.mutate(project.id)
  }

  return (
    <>
      <PageHeader
        title="Projectos"
        description="Só os projectos publicados aparecem no site. Destaques surgem primeiro."
        actions={
          <Link to="/admin/projectos/novo" className={adminButton.primary}>
            <Plus aria-hidden="true" className="size-4" />
            Novo projecto
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={(value) => setParam('q', value)} label="Pesquisar por título ou slug" />
        <label htmlFor={statusId} className="sr-only">
          Estado de publicação
        </label>
        <select
          id={statusId}
          value={status}
          onChange={(e) => setParam('estado', e.target.value)}
          className={`${inputStyle} sm:w-48`}
        >
          <option value="">Todos os estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunhos</option>
        </select>
      </div>

      {list.isPending ? (
        <LoadingBlock />
      ) : list.isError ? (
        <ErrorBlock message={list.error.message} onRetry={() => void list.refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={q || status ? 'Nenhum projecto encontrado' : 'Ainda não há projectos'}
          action={
            <Link to="/admin/projectos/novo" className={adminButton.secondary}>
              <Plus aria-hidden="true" className="size-4" />
              Criar projecto
            </Link>
          }
        />
      ) : (
        <>
          <ul className={`${cardStyle} divide-y divide-line`}>
            {projects.map((project, index) => (
              <li key={project.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3 md:min-w-0 md:flex-1">
                  {canReorder && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className={`${adminButton.icon} size-7`}
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                        <span className="sr-only">{`Subir ${pt(project.title)}`}</span>
                      </button>
                      <button
                        type="button"
                        className={`${adminButton.icon} size-7`}
                        disabled={index === projects.length - 1 || reorder.isPending}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                        <span className="sr-only">{`Descer ${pt(project.title)}`}</span>
                      </button>
                    </div>
                  )}
                  {project.cover ? (
                    <MediaThumb media={project.cover} className="size-14 shrink-0 rounded-lg" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-ink font-display text-xl font-bold text-ink-inverse"
                    >
                      {pt(project.title).charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link to={`/admin/projectos/${project.id}`} className="block truncate font-medium hover:underline">
                      {pt(project.title)}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={project.publication_status === 'published' ? 'green' : 'grey'}>
                        {project.publication_status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      {project.project_status && (
                        <Badge tone="butter">{projectStatusLabels[project.project_status]}</Badge>
                      )}
                      {project.is_featured && <Badge tone="coral">Destaque</Badge>}
                      <span className="font-mono text-xs text-ink-muted">/{project.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Switch
                    checked={project.publication_status === 'published'}
                    disabled={update.isPending}
                    onChange={(value) =>
                      update.mutate({ id: project.id, body: { publication_status: value ? 'published' : 'draft' } })
                    }
                    label={project.publication_status === 'published' ? 'Publicado' : 'Rascunho'}
                  />
                  <button
                    type="button"
                    className={adminButton.icon}
                    aria-pressed={project.is_featured}
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: project.id, body: { is_featured: !project.is_featured } })}
                  >
                    <Star
                      aria-hidden="true"
                      className={`size-4 ${project.is_featured ? 'fill-accent text-accent' : ''}`}
                    />
                    <span className="sr-only">{`Destacar ${pt(project.title)}`}</span>
                  </button>
                  <Link to={`/admin/projectos/${project.id}/pre-visualizacao`} className={adminButton.icon}>
                    <Eye aria-hidden="true" className="size-4" />
                    <span className="sr-only">{`Pré-visualizar ${pt(project.title)}`}</span>
                  </Link>
                  <Link to={`/admin/projectos/${project.id}`} className={adminButton.secondary}>
                    <Pencil aria-hidden="true" className="size-4" />
                    Editar
                  </Link>
                  <button type="button" className={adminButton.dangerGhost} onClick={() => void onDelete(project)}>
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="sr-only">{`Eliminar ${pt(project.title)}`}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={list.data.meta} onPage={(next) => setParam('pagina', String(next))} />
        </>
      )}
    </>
  )
}
