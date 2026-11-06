import { useLocale } from '../../i18n/context'
import type { ProjectStatus } from '../../lib/api/types'

const tone: Record<ProjectStatus, string> = {
  concept: 'bg-support/40 text-plum-950',
  in_progress: 'bg-highlight text-plum-950',
  completed: 'bg-ink text-ink-inverse',
  maintained: 'bg-ink/80 text-ink-inverse',
  paused: 'bg-mauve-500/25 text-ink',
  archived: 'bg-mauve-500/25 text-ink',
}

/** Estado real do projecto (nunca apresenta um projecto em curso como concluído). */
export function StatusBadge({ status }: { status: ProjectStatus | null }) {
  const { t } = useLocale()
  if (!status) return null

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${tone[status]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t.projects.status[status]}
    </span>
  )
}
