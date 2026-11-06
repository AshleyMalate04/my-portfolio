import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, LoaderCircle, Replace, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { ApiError } from '../../../lib/api/client'
import { describeUsage } from '../labels'
import { MediaThumb } from '../media/MediaPicker'
import { useUpload } from '../media/useUpload'
import { ACCEPT, formatBytes } from '../media/utils'
import type { AdminMedia } from '../types'
import { useConfirm } from '../ui/useConfirm'
import { Dialog } from '../ui/Dialog'
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, Pagination, SearchInput } from '../ui/Page'
import { adminButton, inputStyle } from '../ui/styles'
import { useToast } from '../ui/useToast'

/** Biblioteca: carregar (incluindo arrastar e largar), pesquisar, editar, substituir e eliminar ficheiros. */
export function MediaLibraryPage() {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminMedia | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const kindId = useId()

  const query = { q: q || undefined, kind: kind || undefined, page, per_page: 30 }
  const media = useQuery({ queryKey: [...adminKeys.media, 'library', query], queryFn: () => adminApi.media(query) })
  const upload = useUpload()

  const uploadFiles = (files: FileList | null) => Array.from(files ?? []).forEach((file) => upload.mutate(file))

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    uploadFiles(event.dataTransfer.files)
  }

  return (
    <>
      <PageHeader
        title="Biblioteca de ficheiros"
        description="Imagens (JPEG, PNG, WebP, AVIF até 5 MB) e documentos PDF (até 10 MB). O tipo é verificado pelo conteúdo do ficheiro."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={`${ACCEPT.image},${ACCEPT.document}`}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                uploadFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <button
              type="button"
              className={adminButton.primary}
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Upload aria-hidden="true" className="size-4" />
              )}
              Carregar ficheiros
            </button>
          </>
        }
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mb-6 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-ink/15 text-ink-muted'
        }`}
      >
        Arraste ficheiros para aqui para os carregar.
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onChange={(value) => {
            setQ(value)
            setPage(1)
          }}
          label="Pesquisar por nome ou texto alternativo"
        />
        <label htmlFor={kindId} className="sr-only">
          Tipo de ficheiro
        </label>
        <select
          id={kindId}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value)
            setPage(1)
          }}
          className={`${inputStyle} sm:w-44`}
        >
          <option value="">Todos os tipos</option>
          <option value="image">Imagens</option>
          <option value="document">Documentos</option>
        </select>
      </div>

      {media.isPending ? (
        <LoadingBlock />
      ) : media.isError ? (
        <ErrorBlock message={media.error.message} onRetry={() => void media.refetch()} />
      ) : media.data.data.length === 0 ? (
        <EmptyState title={q || kind ? 'Nenhum ficheiro encontrado' : 'A biblioteca está vazia'}>
          Carregue a fotografia de perfil, capas de projectos, o CV e outros ficheiros.
        </EmptyState>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {media.data.data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="group block w-full overflow-hidden rounded-xl border border-line bg-surface-raised text-left transition-colors hover:border-ink"
                >
                  <MediaThumb media={item} className="aspect-square" />
                  <span className="block truncate px-2 pt-2 text-xs font-medium">{item.original_name}</span>
                  <span className="block px-2 pb-2 text-[0.7rem] text-ink-muted">
                    {formatBytes(item.size)} · {item.usage.length > 0 ? `em uso (${item.usage.length})` : 'não usado'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination meta={media.data.meta} onPage={setPage} />
        </>
      )}

      {selected && (
        <MediaDetail key={selected.id} media={selected} onClose={() => setSelected(null)} onChange={setSelected} />
      )}
    </>
  )
}

function MediaDetail({
  media,
  onClose,
  onChange,
}: {
  media: AdminMedia
  onClose: () => void
  onChange: (media: AdminMedia) => void
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const replaceRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState({ pt: media.alt?.pt ?? '', en: media.alt?.en ?? '' })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: adminKeys.all })

  const saveAlt = useMutation({
    mutationFn: () => adminApi.updateMedia(media.id, alt),
    onSuccess: (updated) => {
      onChange(updated)
      invalidate()
      toast.success('Texto alternativo guardado.')
    },
    onError: (error) => toast.error(error.message),
  })

  const replace = useMutation({
    mutationFn: (file: File) => adminApi.replaceMedia(media.id, file),
    onSuccess: (updated) => {
      onChange(updated)
      invalidate()
      toast.success('Ficheiro substituído. Todos os conteúdos que o usam mostram já a nova versão.')
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? (error.fieldError('file') ?? error.message) : error.message),
  })

  const remove = useMutation({
    mutationFn: (force: boolean) => adminApi.removeMedia(media.id, force),
    onSuccess: () => {
      invalidate()
      toast.success('Ficheiro eliminado.')
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  const onDelete = async () => {
    const inUse = media.usage.length > 0
    const ok = await confirm({
      title: 'Eliminar ficheiro?',
      destructive: true,
      confirmLabel: inUse ? 'Eliminar e retirar das utilizações' : 'Eliminar',
      message: inUse ? (
        <>
          <p>Este ficheiro está a ser usado em:</p>
          <ul className="mt-2 list-disc pl-5">
            {media.usage.map((usage, i) => (
              <li key={i}>{describeUsage(usage)}</li>
            ))}
          </ul>
          <p className="mt-2">
            Ao eliminar, estes conteúdos ficam sem a imagem/documento. Para manter as referências, use “Substituir”.
          </p>
        </>
      ) : (
        'O ficheiro será eliminado definitivamente.'
      ),
    })
    if (ok) remove.mutate(inUse)
  }

  return (
    <Dialog open onClose={onClose} size="lg" title={media.original_name}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <MediaThumb media={media} className="aspect-[4/3] rounded-xl" />
          <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-ink-muted">
            <dt>Tipo</dt>
            <dd>{media.mime_type}</dd>
            <dt>Tamanho</dt>
            <dd>{formatBytes(media.size)}</dd>
            {media.width && (
              <>
                <dt>Dimensões</dt>
                <dd>
                  {media.width}×{media.height} px
                </dd>
              </>
            )}
          </dl>
        </div>
        <div className="space-y-5">
          {media.kind === 'image' && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                saveAlt.mutate()
              }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Texto alternativo</p>
              <p className="text-xs text-ink-muted">Descreve a imagem para quem usa leitores de ecrã.</p>
              {(['pt', 'en'] as const).map((locale) => (
                <label key={locale} className="block text-xs text-ink-muted">
                  {locale.toUpperCase()}
                  <input
                    value={alt[locale]}
                    maxLength={255}
                    onChange={(event) => setAlt({ ...alt, [locale]: event.target.value })}
                    className={`${inputStyle} mt-1 text-ink`}
                  />
                </label>
              ))}
              <button type="submit" className={adminButton.secondary} disabled={saveAlt.isPending}>
                Guardar texto alternativo
              </button>
            </form>
          )}

          <div>
            <p className="text-sm font-medium">Utilizações</p>
            {media.usage.length === 0 ? (
              <p className="mt-1 text-xs text-ink-muted">Não está a ser usado em nenhum conteúdo.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-xs text-ink-muted">
                {media.usage.map((usage, i) => (
                  <li key={i}>{describeUsage(usage)}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <a href={media.url} target="_blank" rel="noopener noreferrer" className={adminButton.ghost}>
              <ExternalLink aria-hidden="true" className="size-4" />
              Abrir
            </a>
            <button
              type="button"
              className={adminButton.ghost}
              onClick={() => {
                void navigator.clipboard?.writeText(media.url).then(() => toast.success('Endereço copiado.'))
              }}
            >
              <Copy aria-hidden="true" className="size-4" />
              Copiar endereço
            </button>
            <input
              ref={replaceRef}
              type="file"
              accept={ACCEPT[media.kind]}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) replace.mutate(file)
                event.target.value = ''
              }}
            />
            <button
              type="button"
              className={adminButton.secondary}
              disabled={replace.isPending}
              onClick={() => replaceRef.current?.click()}
            >
              {replace.isPending ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Replace aria-hidden="true" className="size-4" />
              )}
              Substituir
            </button>
            <button
              type="button"
              className={adminButton.dangerGhost}
              disabled={remove.isPending}
              onClick={() => void onDelete()}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
