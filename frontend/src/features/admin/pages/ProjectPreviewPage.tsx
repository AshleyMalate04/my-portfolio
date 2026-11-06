import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { LocaleProvider } from '../../../i18n/LocaleContext'
import type { Locale } from '../../../i18n/locales'
import { adminApi } from '../../../lib/api/admin'
import { ProjectDetail } from '../../../pages/public/ProjectPage'
import { ErrorBlock, LoadingBlock } from '../ui/Page'
import { adminButton } from '../ui/styles'

/**
 * Pré-visualização de um projecto (incluindo rascunhos) com os mesmos componentes do site público.
 * Os dados vêm de uma rota administrativa; nada fica visível publicamente.
 */
export function ProjectPreviewPage() {
  const { id } = useParams()
  const [locale, setLocale] = useState<Locale>('pt')
  const preview = useQuery({
    queryKey: ['admin', 'projects', 'preview', Number(id), locale],
    queryFn: () => adminApi.projectPreview(Number(id), locale),
  })

  return (
    <>
      <div className="sticky top-16 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-butter-300/80 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <Link to={`/admin/projectos/${id}`} className="inline-flex items-center gap-1 text-sm font-medium">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar à edição
        </Link>
        <p className="text-sm">Pré-visualização — tal como aparecerá no site depois de publicado.</p>
        <div className="flex gap-1" role="group" aria-label="Idioma da pré-visualização">
          {(['pt', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
              className={locale === code ? adminButton.primary : adminButton.ghost}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {preview.isPending ? (
        <LoadingBlock />
      ) : preview.isError ? (
        <ErrorBlock message={preview.error.message} onRetry={() => void preview.refetch()} />
      ) : (
        <div className="-mx-4 overflow-hidden rounded-2xl border border-line bg-surface sm:mx-0">
          <LocaleProvider locale={locale}>
            <ProjectDetail project={preview.data} preview />
          </LocaleProvider>
        </div>
      )}
    </>
  )
}
