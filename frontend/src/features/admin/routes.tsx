import type { RouteObject } from 'react-router'
import { RouteErrorPage } from '../../pages/RouteErrorPage'

/**
 * Rotas do backoffice. Todo o código do painel é carregado a pedido (fora do bundle do site público).
 * Protecção no cliente com RequireAdmin (dentro de AdminShell); a autorização real é feita pelo Laravel.
 */
const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) => ({
  lazy: async () => ({ Component: (await load())[name] as React.ComponentType }),
})

const pages = () => import('./pages/CollectionPages')

export const adminRoutes: RouteObject = {
  path: '/admin',
  errorElement: <RouteErrorPage />,
  ...page(() => import('./AdminRoot'), 'AdminRoot'),
  children: [
    { path: 'login', ...page(() => import('./pages/AuthPages'), 'LoginPage') },
    { path: 'recuperar-palavra-passe', ...page(() => import('./pages/AuthPages'), 'ForgotPasswordPage') },
    { path: 'redefinir-palavra-passe', ...page(() => import('./pages/AuthPages'), 'ResetPasswordPage') },
    {
      ...page(() => import('./AdminShell'), 'AdminShell'),
      children: [
        { index: true, ...page(() => import('./pages/DashboardPage'), 'DashboardPage') },
        { path: 'perfil', ...page(() => import('./pages/ProfilePage'), 'ProfilePage') },
        { path: 'projectos', ...page(() => import('./pages/ProjectsListPage'), 'ProjectsListPage') },
        { path: 'projectos/novo', ...page(() => import('./pages/ProjectEditPage'), 'ProjectEditPage') },
        { path: 'projectos/:id', ...page(() => import('./pages/ProjectEditPage'), 'ProjectEditPage') },
        {
          path: 'projectos/:id/pre-visualizacao',
          ...page(() => import('./pages/ProjectPreviewPage'), 'ProjectPreviewPage'),
        },
        { path: 'competencias', ...page(pages, 'SkillsPage') },
        { path: 'servicos', ...page(pages, 'ServicesPage') },
        { path: 'metodologia', ...page(pages, 'ProcessStepsPage') },
        { path: 'percurso', ...page(pages, 'JourneyPage') },
        { path: 'testemunhos', ...page(pages, 'TestimonialsPage') },
        { path: 'tecnologias', ...page(pages, 'TechnologiesPage') },
        { path: 'categorias', ...page(pages, 'ProjectCategoriesPage') },
        { path: 'redes-sociais', ...page(pages, 'SocialLinksPage') },
        { path: 'ficheiros', ...page(() => import('./pages/MediaLibraryPage'), 'MediaLibraryPage') },
        { path: 'definicoes', ...page(() => import('./pages/SettingsPage'), 'SettingsPage') },
        { path: '*', ...page(() => import('./pages/AdminNotFound'), 'AdminNotFound') },
      ],
    },
  ],
}
