import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Award,
  ExternalLink,
  FolderKanban,
  Images,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Quote,
  Settings,
  Share2,
  Sparkles,
  Tags,
  UserRound,
  Workflow,
  Cpu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { adminApi, adminKeys } from '../../lib/api/admin'
import { queryKeys } from '../../lib/api/queryKeys'
import { ThemeSwitcher } from '../../theme/ThemeSwitcher'
import { RequireAdmin } from './RequireAdmin'
import { useAdminSession } from './useAdminSession'
import { useToast } from './ui/useToast'
import { adminButton } from './ui/styles'

interface NavEntry {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navigation: { title: string; items: NavEntry[] }[] = [
  { title: '', items: [{ to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true }] },
  {
    title: 'Conteúdo',
    items: [
      { to: '/admin/perfil', label: 'Perfil', icon: UserRound },
      { to: '/admin/projectos', label: 'Projectos', icon: FolderKanban },
      { to: '/admin/competencias', label: 'Competências', icon: Layers },
      { to: '/admin/servicos', label: 'Serviços', icon: Sparkles },
      { to: '/admin/metodologia', label: 'Metodologia', icon: Workflow },
      { to: '/admin/percurso', label: 'Percurso', icon: Award },
      { to: '/admin/testemunhos', label: 'Testemunhos', icon: Quote },
    ],
  },
  {
    title: 'Organização',
    items: [
      { to: '/admin/tecnologias', label: 'Tecnologias', icon: Cpu },
      { to: '/admin/categorias', label: 'Categorias de projectos', icon: Tags },
      { to: '/admin/redes-sociais', label: 'Redes sociais', icon: Share2 },
    ],
  },
  {
    title: 'Ficheiros e definições',
    items: [
      { to: '/admin/ficheiros', label: 'Biblioteca de ficheiros', icon: Images },
      { to: '/admin/definicoes', label: 'Definições', icon: Settings },
    ],
  },
]

/** Estrutura do backoffice protegido: sidebar (gaveta em telemóveis), cabeçalho e conteúdo. */
export function AdminShell() {
  return (
    <RequireAdmin>
      <Shell />
    </RequireAdmin>
  )
}

function Shell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Fecha a gaveta ao navegar e com Escape.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_1fr]">
      <a
        href="#admin-conteudo"
        className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-ink-inverse focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar para o conteúdo
      </a>

      {open && (
        <div aria-hidden="true" className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-nav text-nav-ink transition-transform duration-base lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/admin" className="font-display text-xl font-extrabold tracking-tight">
            ashley<span className="text-accent">.</span>
            <span className="ml-2 font-mono text-[0.65rem] font-normal tracking-normal text-nav-muted">backoffice</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-nav-muted hover:text-nav-ink lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Fechar menu</span>
          </button>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-col">
        <Topbar onMenu={() => setOpen(true)} menuOpen={open} />
        <main
          id="admin-conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarNav() {
  return (
    <nav aria-label="Backoffice" className="flex-1 overflow-y-auto px-3 pb-6">
      {navigation.map((group) => (
        <div key={group.title || 'main'} className="mt-4">
          {group.title && (
            <p className="px-3 pb-1 font-mono text-[0.65rem] tracking-[0.14em] text-nav-muted uppercase">
              {group.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-nav-active font-medium text-nav-active-ink'
                        : 'text-nav-ink/80 hover:bg-nav-hover hover:text-nav-ink'
                    }`
                  }
                >
                  <item.icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Topbar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const session = useAdminSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const logout = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: adminKeys.all })
      queryClient.removeQueries({ queryKey: queryKeys.adminSession })
      navigate('/admin/login', { replace: true })
    },
    onError: () => toast.error('Não foi possível terminar a sessão. Tente novamente.'),
  })

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm sm:px-8">
      <button
        type="button"
        className={`${adminButton.icon} lg:hidden`}
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-controls="admin-sidebar"
      >
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">Abrir menu</span>
      </button>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeSwitcher />
        <a href="/" target="_blank" rel="noopener noreferrer" className={adminButton.ghost}>
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Ver site</span>
          <span className="sr-only sm:hidden">Ver site</span>
        </a>
        {session.data && (
          <span className="hidden text-sm text-ink-muted md:inline" title={session.data.email}>
            {session.data.name}
          </span>
        )}
        <button
          type="button"
          className={adminButton.secondary}
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut aria-hidden="true" className="size-4" />
          Terminar sessão
        </button>
      </div>
    </header>
  )
}
