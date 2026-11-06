import {
  ClipboardList,
  CodeXml,
  Database,
  Globe,
  LayoutDashboard,
  LayoutTemplate,
  Plug,
  Server,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/**
 * Ícones permitidos para serviços (nome guardado no backoffice → componente).
 * Uma lista fechada evita importar todos os ícones e ignora nomes desconhecidos.
 */
const icons: Record<string, LucideIcon> = {
  'clipboard-list': ClipboardList,
  'code-xml': CodeXml,
  database: Database,
  globe: Globe,
  'layout-dashboard': LayoutDashboard,
  'layout-template': LayoutTemplate,
  plug: Plug,
  server: Server,
  smartphone: Smartphone,
  wrench: Wrench,
}

export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && icons[name]) || Sparkles
  return <Icon aria-hidden="true" className={className} strokeWidth={1.5} />
}
