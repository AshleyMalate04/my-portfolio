import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useController, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { pt } from '../collections/values'
import { FormSection, SelectField, SwitchField, TextField, TranslatableField } from '../forms/fields'
import {
  applyServerErrors,
  listInput,
  listPayload,
  nullable,
  nullableId,
  translatedInput,
  type TranslatedInput,
} from '../forms/payload'
import { SaveBar } from '../forms/SaveBar'
import { useUnsavedChanges } from '../forms/useUnsavedChanges'
import { MediaField } from '../media/MediaField'
import { MediaPicker, MediaThumb } from '../media/MediaPicker'
import type { AdminProject, AdminRecord } from '../types'
import { useConfirm } from '../ui/useConfirm'
import { Badge, ErrorBlock, LoadingBlock, PageHeader } from '../ui/Page'
import { adminButton, cardStyle } from '../ui/styles'
import { useToast } from '../ui/useToast'
import { projectStatusLabels, slugify } from '../labels'

const textSections = [
  'summary',
  'description',
  'problem',
  'objective',
  'solution',
  'contribution',
  'challenges',
  'results',
] as const
const translatedFields = ['title', ...textSections, 'seo_title', 'seo_description'] as const
type TranslatedKey = (typeof translatedFields)[number]

type ProjectForm = {
  slug: string
  features: TranslatedInput
  project_category_id: string
  project_status: string
  publication_status: 'draft' | 'published'
  is_featured: boolean
  started_at: string
  ended_at: string
  demo_url: string
  repository_url: string
  cover_media_id: number | null
  internal_notes: string
  technology_ids: number[]
} & Record<TranslatedKey, TranslatedInput>

function toForm(project: AdminProject | null): ProjectForm {
  return {
    ...(Object.fromEntries(translatedFields.map((key) => [key, translatedInput(project?.[key])])) as Record<
      TranslatedKey,
      TranslatedInput
    >),
    slug: project?.slug ?? '',
    features: listInput(project?.features),
    project_category_id: project?.project_category_id ? String(project.project_category_id) : '',
    project_status: project?.project_status ?? '',
    publication_status: project?.publication_status ?? 'draft',
    is_featured: project?.is_featured ?? false,
    started_at: project?.started_at ?? '',
    ended_at: project?.ended_at ?? '',
    demo_url: project?.demo_url ?? '',
    repository_url: project?.repository_url ?? '',
    cover_media_id: project?.cover_media_id ?? null,
    internal_notes: project?.internal_notes ?? '',
    technology_ids: project?.technology_ids ?? [],
  }
}

function toPayload(values: ProjectForm): Record<string, unknown> {
  return {
    ...Object.fromEntries(translatedFields.map((key) => [key, values[key]])),
    slug: values.slug.trim(),
    features: listPayload(values.features),
    project_category_id: nullableId(values.project_category_id),
    project_status: nullable(values.project_status),
    publication_status: values.publication_status,
    is_featured: values.is_featured,
    started_at: nullable(values.started_at),
    ended_at: nullable(values.ended_at),
    demo_url: nullable(values.demo_url),
    repository_url: nullable(values.repository_url),
    cover_media_id: nullableId(values.cover_media_id),
    internal_notes: nullable(values.internal_notes),
    technology_ids: values.technology_ids,
  }
}

const fieldNames = [
  ...[...translatedFields, 'features'].flatMap((key) => [`${key}.pt`, `${key}.en`, key]),
  'slug',
  'project_category_id',
  'project_status',
  'publication_status',
  'is_featured',
  'started_at',
  'ended_at',
  'demo_url',
  'repository_url',
  'cover_media_id',
  'internal_notes',
  'technology_ids',
]

export function ProjectEditPage() {
  const { id } = useParams()
  const projectId = id ? Number(id) : null
  const project = useQuery({
    queryKey: adminKeys.record('projects', projectId ?? 0),
    queryFn: () => adminApi.get<AdminProject>('projects', projectId!),
    enabled: projectId !== null,
  })

  if (projectId !== null && project.isPending) return <LoadingBlock />
  if (projectId !== null && project.isError)
    return <ErrorBlock message={project.error.message} onRetry={() => void project.refetch()} />

  // A chave remonta o formulário quando se passa de "novo" para o projecto criado.
  return <ProjectEditor key={projectId ?? 'new'} project={projectId !== null ? project.data! : null} />
}

function ProjectEditor({ project }: { project: AdminProject | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [errors, setErrors] = useState<string[]>([])
  const form = useForm<ProjectForm>({ defaultValues: toForm(project) })
  const { isDirty } = form.formState
  const published = useWatch({ control: form.control, name: 'publication_status' }) === 'published'

  useUnsavedChanges(isDirty)

  // Depois de criar, abre a página do novo projecto só quando o formulário já está limpo
  // (caso contrário o aviso de alterações por guardar bloquearia a navegação).
  const [createdId, setCreatedId] = useState<number | null>(null)
  useEffect(() => {
    if (createdId !== null && !isDirty) navigate(`/admin/projectos/${createdId}`, { replace: true })
  }, [createdId, isDirty, navigate])

  const categories = useQuery({
    queryKey: adminKeys.list('project-categories', { per_page: 100 }),
    queryFn: () => adminApi.list('project-categories', { per_page: 100 }),
  })

  const save = useMutation({
    mutationFn: (values: ProjectForm) =>
      project
        ? adminApi.update<AdminProject>('projects', project.id, toPayload(values))
        : adminApi.create<AdminProject>('projects', toPayload(values)),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.resource('projects') })
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
      queryClient.setQueryData(adminKeys.record('projects', response.data.id), response.data)
      setErrors([])
      toast.success(response.message)
      form.reset(toForm(response.data))
      if (!project) setCreatedId(response.data.id)
    },
    onError: (error) => setErrors(applyServerErrors(error, form.setError, fieldNames)),
  })

  const submit = (status?: 'draft' | 'published') =>
    form.handleSubmit((values) => save.mutate(status ? { ...values, publication_status: status } : values))

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/admin/projectos" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Projectos
          </Link>
        }
        title={project ? pt(project.title) || 'Projecto' : 'Novo projecto'}
        description={
          project ? (
            <span className="inline-flex items-center gap-2">
              <Badge tone={project.publication_status === 'published' ? 'green' : 'grey'}>
                {project.publication_status === 'published' ? 'Publicado' : 'Rascunho'}
              </Badge>
              {project.publication_status === 'published'
                ? 'Visível no site.'
                : 'Não visível no site até ser publicado.'}
            </span>
          ) : (
            'Os projectos novos ficam em rascunho até serem publicados.'
          )
        }
        actions={
          project && (
            <Link to={`/admin/projectos/${project.id}/pre-visualizacao`} className={adminButton.secondary}>
              <Eye aria-hidden="true" className="size-4" />
              Pré-visualizar
            </Link>
          )
        }
      />

      <FormProvider {...form}>
        <form noValidate onSubmit={submit()}>
          <FormSection title="Identificação">
            <TranslatableField name="title" label="Título" required maxLength={160} />
            <SlugField isNew={!project} />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                name="project_category_id"
                label="Categoria"
                emptyLabel="Sem categoria"
                options={(categories.data?.data ?? []).map((category) => ({
                  value: category.id,
                  label: pt(category.name),
                }))}
                help={
                  <Link to="/admin/categorias" className="underline underline-offset-2">
                    Gerir categorias
                  </Link>
                }
              />
              <SelectField
                name="project_status"
                label="Estado do projecto"
                emptyLabel="Não indicado"
                options={Object.entries(projectStatusLabels).map(([value, label]) => ({ value, label }))}
                help="Estado real: nunca indique “Concluído” sem confirmação."
              />
              <TextField name="started_at" label="Início" type="date" help="Apenas datas confirmadas." />
              <TextField name="ended_at" label="Fim" type="date" />
            </div>
            <SwitchField name="is_featured" label="Destacar na página inicial" />
          </FormSection>

          <FormSection title="Conteúdo" description="Só as secções preenchidas aparecem na página do projecto.">
            <TranslatableField
              name="summary"
              label="Resumo"
              multiline
              rows={2}
              maxLength={500}
              help="Aparece nos cartões."
            />
            <TranslatableField name="description" label="Descrição detalhada" multiline rows={5} maxLength={10000} />
            <TranslatableField name="problem" label="Contexto e problema" multiline rows={4} maxLength={5000} />
            <TranslatableField name="objective" label="Objectivo" multiline rows={3} maxLength={5000} />
            <TranslatableField name="solution" label="Solução" multiline rows={4} maxLength={5000} />
            <TranslatableField name="contribution" label="Contribuição pessoal" multiline rows={4} maxLength={5000} />
            <TranslatableField name="challenges" label="Desafios" multiline rows={3} maxLength={5000} />
            <TranslatableField name="features" label="Funcionalidades" list rows={5} />
            <TranslatableField
              name="results"
              label="Resultados documentados"
              multiline
              rows={3}
              maxLength={5000}
              help="Apenas resultados reais e verificáveis."
            />
          </FormSection>

          <FormSection title="Tecnologias" description="A ordem de selecção é a ordem apresentada no site.">
            <TechnologyPicker />
          </FormSection>

          <FormSection title="Imagens" description="A capa aparece nos cartões e no topo da página do projecto.">
            <MediaField
              name="cover_media_id"
              label="Capa"
              kind="image"
              initial={project?.cover}
              help="Recomendado 1600×1000 px."
            />
            {project ? (
              <Gallery project={project} />
            ) : (
              <p className="text-sm text-ink-muted">Guarde o projecto para adicionar imagens à galeria.</p>
            )}
          </FormSection>

          <FormSection title="Ligações" description="Só aparecem no site quando preenchidas.">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField name="demo_url" label="Demonstração" type="url" placeholder="https://" />
              <TextField name="repository_url" label="Repositório" type="url" placeholder="https://" />
            </div>
          </FormSection>

          <FormSection title="SEO" description="Por omissão usa o título e o resumo.">
            <TranslatableField name="seo_title" label="Título SEO" maxLength={70} />
            <TranslatableField name="seo_description" label="Descrição SEO" multiline rows={2} maxLength={170} />
          </FormSection>

          <FormSection title="Notas internas" description="Nunca aparecem no site.">
            <TextField
              name="internal_notes"
              label="Notas"
              multiline
              rows={3}
              maxLength={5000}
              help="Ex.: dados por confirmar antes de publicar."
            />
          </FormSection>

          <SaveBar
            isDirty={isDirty || !project}
            isSaving={save.isPending}
            errors={errors}
            label={published ? 'Guardar' : 'Guardar rascunho'}
            extra={
              published ? (
                <button
                  type="button"
                  className={adminButton.secondary}
                  onClick={submit('draft')}
                  disabled={save.isPending}
                >
                  Despublicar
                </button>
              ) : (
                <button
                  type="button"
                  className={adminButton.accent}
                  onClick={submit('published')}
                  disabled={save.isPending}
                >
                  Guardar e publicar
                </button>
              )
            }
          />
        </form>
      </FormProvider>
    </>
  )
}

/** Slug gerado automaticamente a partir do título em projectos novos (até ser editado à mão). */
function SlugField({ isNew }: { isNew: boolean }) {
  const { field: slug, fieldState } = useController<ProjectForm, 'slug'>({ name: 'slug' })
  const titlePt = useWatch<ProjectForm, 'title.pt'>({ name: 'title.pt' })
  const [touched, setTouched] = useState(!isNew)
  const suggested = slugify(titlePt ?? '')

  const { onChange } = slug
  useEffect(() => {
    if (!touched) onChange(suggested)
  }, [touched, suggested, onChange])

  return (
    <div>
      <label htmlFor="project-slug" className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        Endereço (slug) <span className="text-xs font-normal text-accent-ink">obrigatório</span>
      </label>
      <div className="flex items-center rounded-lg border border-ink/20 bg-surface-raised focus-within:border-ink">
        <span className="pl-3 font-mono text-xs text-ink-muted">/projectos/</span>
        <input
          id="project-slug"
          value={slug.value}
          onChange={(event) => {
            setTouched(true)
            slug.onChange(event.target.value)
          }}
          onBlur={slug.onBlur}
          aria-invalid={Boolean(fieldState.error)}
          aria-describedby="project-slug-help"
          className="min-h-10 flex-1 bg-transparent px-1 font-mono text-sm outline-none"
        />
      </div>
      <p id="project-slug-help" className="mt-1.5 text-xs text-ink-muted">
        Minúsculas, números e hífenes. Alterar o slug de um projecto publicado muda o seu endereço.
      </p>
      {fieldState.error && <p className="mt-1 text-xs font-medium text-danger">{fieldState.error.message}</p>}
    </div>
  )
}

function TechnologyPicker() {
  const { field, fieldState } = useController<ProjectForm, 'technology_ids'>({ name: 'technology_ids' })
  const technologies = useQuery({
    queryKey: adminKeys.list('technologies', { per_page: 100 }),
    queryFn: () => adminApi.list('technologies', { per_page: 100 }),
  })
  const selected = field.value
  const all = (technologies.data?.data ?? []).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)))
  const byId = new Map<number, AdminRecord>(all.map((technology) => [technology.id, technology]))

  const toggle = (id: number) =>
    field.onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])

  return (
    <div>
      {selected.length > 0 && (
        <p className="mb-3 text-sm">
          <span className="text-ink-muted">Seleccionadas: </span>
          {selected.map((id) => String(byId.get(id)?.name ?? id)).join(', ')}
        </p>
      )}
      {technologies.isPending ? (
        <p className="text-sm text-ink-muted">A carregar tecnologias…</p>
      ) : (
        <fieldset>
          <legend className="sr-only">Tecnologias</legend>
          <div className="flex flex-wrap gap-2">
            {all.map((technology) => {
              const active = selected.includes(technology.id)
              return (
                <button
                  key={technology.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(technology.id)}
                  className={`min-h-9 rounded-lg border px-3 font-mono text-xs transition-colors ${
                    active ? 'border-ink bg-ink text-ink-inverse' : 'border-ink/20 hover:border-ink/50'
                  }`}
                >
                  {String(technology.name)}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      <p className="mt-2 text-xs text-ink-muted">
        Falta alguma?{' '}
        <Link to="/admin/tecnologias" className="underline underline-offset-2">
          Adicionar tecnologia
        </Link>
      </p>
      {fieldState.error && <p className="mt-1 text-xs font-medium text-danger">{fieldState.error.message}</p>}
    </div>
  )
}

/** Galeria gravada imediatamente (independente do botão Guardar). */
function Gallery({ project }: { project: AdminProject }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const images = project.images ?? []

  const apply = (response: { data: AdminProject; message: string }) => {
    const key = adminKeys.record('projects', project.id)
    const current = queryClient.getQueryData<AdminProject>(key)
    queryClient.setQueryData(key, { ...current, images: response.data.images })
  }

  const mutation = useMutation({
    mutationFn: (action: () => Promise<{ data: AdminProject; message: string }>) => action(),
    onSuccess: (response) => {
      apply(response)
      void queryClient.invalidateQueries({ queryKey: adminKeys.resource('projects') })
    },
    onError: (error) => toast.error(error.message),
  })

  const move = (index: number, direction: -1 | 1) => {
    const ids = images.map((image) => image.id)
    const target = index + direction
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    mutation.mutate(() => adminApi.reorderProjectImages(project.id, ids))
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Galeria ({images.length})</p>
        <button type="button" className={adminButton.secondary} onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Adicionar imagem
        </button>
      </div>
      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 p-4 text-sm text-ink-muted">
          Sem imagens na galeria.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id} className={`${cardStyle} overflow-hidden`}>
              <MediaThumb media={image.media} className="aspect-video" />
              <div className="space-y-2 p-3">
                <CaptionInput
                  initial={image.caption?.pt ?? ''}
                  onSave={(caption) =>
                    mutation.mutate(() =>
                      adminApi.updateProjectImage(project.id, image.id, { pt: caption, en: image.caption?.en ?? '' }),
                    )
                  }
                />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`${adminButton.icon} size-8`}
                      disabled={index === 0 || mutation.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                      <span className="sr-only">Mover imagem {index + 1} para trás</span>
                    </button>
                    <button
                      type="button"
                      className={`${adminButton.icon} size-8`}
                      disabled={index === images.length - 1 || mutation.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                      <span className="sr-only">Mover imagem {index + 1} para a frente</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className={adminButton.dangerGhost}
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Retirar imagem da galeria?',
                        message: 'A imagem deixa de aparecer neste projecto, mas continua na biblioteca de ficheiros.',
                        confirmLabel: 'Retirar',
                        destructive: true,
                      })
                      if (ok) mutation.mutate(() => adminApi.removeProjectImage(project.id, image.id))
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Retirar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <MediaPicker
        open={open}
        kind="image"
        title="Adicionar imagem à galeria"
        onClose={() => setOpen(false)}
        onSelect={(media) => mutation.mutate(() => adminApi.addProjectImage(project.id, media.id))}
      />
    </div>
  )
}

function CaptionInput({ initial, onSave }: { initial: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initial)

  return (
    <label className="block text-xs text-ink-muted">
      Legenda (PT)
      <input
        value={value}
        maxLength={255}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => value !== initial && onSave(value)}
        className="mt-1 block w-full min-h-9 rounded-lg border border-ink/20 bg-surface px-2 text-sm text-ink"
      />
    </label>
  )
}
