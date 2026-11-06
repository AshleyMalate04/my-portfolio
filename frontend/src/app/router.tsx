import type { RouteObject } from 'react-router'
import { adminRoutes } from '../features/admin/routes'
import { locales, localePrefix, type Locale } from '../i18n/locales'
import { PublicLayout } from '../layouts/PublicLayout'
import { NotFoundPage } from '../pages/NotFoundPage'
import { HomePage } from '../pages/public/HomePage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { paths } from '../routes/paths'

/**
 * Rotas públicas, repetidas para cada idioma (raiz = pt, /en = en).
 * A página inicial vai no bundle principal; as restantes páginas e o backoffice são carregados a pedido.
 */
function publicRoutes(locale: Locale): RouteObject {
  const projects = paths.projectsSegment(locale)

  return {
    path: localePrefix(locale) || '/',
    element: <PublicLayout locale={locale} />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: projects,
        lazy: async () => ({ Component: (await import('../pages/public/ProjectsPage')).ProjectsPage }),
      },
      {
        path: `${projects}/:slug`,
        lazy: async () => ({ Component: (await import('../pages/public/ProjectPage')).ProjectPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  }
}

export const routes: RouteObject[] = [adminRoutes, ...locales.map(publicRoutes)]
