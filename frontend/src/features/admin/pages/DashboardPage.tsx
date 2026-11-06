import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FolderKanban, Images, Plus, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { adminApi, adminKeys } from '../../../lib/api/admin'
import { Badge, ErrorBlock, LoadingBlock, PageHeader } from '../ui/Page'
import { adminButton, cardStyle } from '../ui/styles'
import { useAdminSession } from '../useAdminSession'

const changeLinks: Record<string, { label: string; to: (id: number) => string }> = {
  project: { label: 'Projecto', to: (id) => `/admin/projectos/${id}` },
  service: { label: 'Serviço', to: () => '/admin/servicos' },
  skill: { label: 'Competência', to: () => '/admin/competencias' },
  education: { label: 'Formação', to: () => '/admin/percurso' },
  experience: { label: 'Experiência', to: () => '/admin/percurso' },
  certification: { label: 'Certificação', to: () => '/admin/percurso' },
  testimonial: { label: 'Testemunho', to: () => '/admin/testemunhos' },
  profile: { label: 'Perfil', to: () => '/admin/perfil' },
}

const dateTime = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })

/** Painel com totais reais da base de dados. Sem estatísticas de tráfego (não há integração configurada). */
export function DashboardPage() {
  const session = useAdminSession()
  const summary = useQuery({ queryKey: adminKeys.dashboard, queryFn: adminApi.dashboard })

  return (
    <>
      <PageHeader
        title={`Olá${session.data ? `, ${session.data.name.split(' ')[0]}` : ''}.`}
        description="Resumo do que está no site. Os números vêm directamente da base de dados."
        actions={
          <>
            <Link to="/admin/projectos/novo" className={adminButton.primary}>
              <Plus aria-hidden="true" className="size-4" />
              Novo projecto
            </Link>
          </>
        }
      />

      {summary.isPending ? (
        <LoadingBlock />
      ) : summary.isError ? (
        <ErrorBlock message={summary.error.message} onRetry={() => void summary.refetch()} />
      ) : (
        <div className="space-y-8">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Projectos publicados"
              value={summary.data.projects.published}
              to="/admin/projectos?estado=published"
            />
            <Stat
              label="Projectos em rascunho"
              value={summary.data.projects.draft}
              to="/admin/projectos?estado=draft"
            />
            <Stat label="Ficheiros na biblioteca" value={summary.data.media.total} to="/admin/ficheiros" />
            <Stat
              label="Competências publicadas"
              value={summary.data.skills.published}
              to="/admin/competencias"
              note={`${summary.data.skills.total} registada(s)`}
            />
          </dl>

          <div>
            <Panel title="Alterações recentes">
              {summary.data.recent_changes.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-muted">Sem conteúdos registados.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {summary.data.recent_changes.map((change) => {
                    const link = changeLinks[change.type]
                    return (
                      <li key={`${change.type}-${change.id}`}>
                        <Link
                          to={link?.to(change.id) ?? '/admin'}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-ink/5"
                        >
                          <Badge tone="lavender">{link?.label ?? change.type}</Badge>
                          <span className="min-w-0 flex-1 truncate text-sm">{change.label || 'Sem título'}</span>
                          {change.updated_at && (
                            <time dateTime={change.updated_at} className="shrink-0 text-xs text-ink-muted">
                              {dateTime.format(new Date(change.updated_at))}
                            </time>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Atalhos">
            <div className="grid gap-px bg-line sm:grid-cols-3">
              <Shortcut to="/admin/perfil" icon={<UserRound className="size-5" />} label="Editar perfil" />
              <Shortcut to="/admin/projectos" icon={<FolderKanban className="size-5" />} label="Gerir projectos" />
              <Shortcut to="/admin/ficheiros" icon={<Images className="size-5" />} label="Biblioteca de ficheiros" />
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}

function Stat({ label, value, to, note }: { label: string; value: number; to: string; note?: string }) {
  return (
    <Link to={to} className={`${cardStyle} group block p-5 transition-colors hover:border-ink/40`}>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-4xl font-extrabold">{value}</span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 text-ink-muted transition-transform group-hover:translate-x-1"
        />
      </dd>
      {note && <dd className="mt-1 text-xs text-ink-muted">{note}</dd>}
    </Link>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${cardStyle} overflow-hidden`}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function Shortcut({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-surface-raised px-5 py-4 text-sm font-medium hover:bg-surface">
      <span aria-hidden="true" className="text-accent-ink">
        {icon}
      </span>
      {label}
    </Link>
  )
}
