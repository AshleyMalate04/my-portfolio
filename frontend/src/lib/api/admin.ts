import type {
  AdminMedia,
  AdminProfile,
  AdminProject,
  AdminRecord,
  DashboardSummary,
  PageOf,
  SettingsPayload,
} from '../../features/admin/types'
import { apiRequest } from './client'
import type { AdminUser, DataResponse, Project } from './types'

export interface LoginInput {
  email: string
  password: string
  remember?: boolean
}

type Query = Record<string, string | number | boolean | undefined>
type Saved<T> = { data: T; message: string }

const unwrap = <T>(response: DataResponse<T>): T => response.data

/** Recurso administrativo com CRUD e ordenação (ver routes/api.php). */
export type AdminResource =
  | 'projects'
  | 'project-categories'
  | 'technologies'
  | 'skill-categories'
  | 'skills'
  | 'educations'
  | 'experiences'
  | 'certifications'
  | 'services'
  | 'process-steps'
  | 'social-links'
  | 'testimonials'

/** Endpoints do backoffice. Sessão por cookie Sanctum; CSRF e erros tratados pelo cliente comum. */
export const adminApi = {
  // Autenticação
  login: (input: LoginInput) =>
    apiRequest<DataResponse<AdminUser>>('/admin/auth/login', { method: 'POST', body: input }).then(unwrap),
  me: () => apiRequest<DataResponse<AdminUser>>('/admin/auth/me').then(unwrap),
  logout: () => apiRequest<{ message: string }>('/admin/auth/logout', { method: 'POST' }),
  authOptions: () => apiRequest<DataResponse<{ password_reset: boolean }>>('/admin/auth/options').then(unwrap),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/admin/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body: { token: string; email: string; password: string; password_confirmation: string }) =>
    apiRequest<{ message: string }>('/admin/auth/reset-password', { method: 'POST', body }),
  changePassword: (body: { current_password: string; password: string; password_confirmation: string }) =>
    apiRequest<{ message: string }>('/admin/auth/password', { method: 'PUT', body }),

  dashboard: () => apiRequest<DataResponse<DashboardSummary>>('/admin/dashboard/summary').then(unwrap),

  // Perfil e definições
  profile: () => apiRequest<DataResponse<AdminProfile | null>>('/admin/profile').then(unwrap),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest<Saved<AdminProfile>>('/admin/profile', { method: 'PUT', body }),
  settings: () => apiRequest<DataResponse<SettingsPayload>>('/admin/settings').then(unwrap),
  updateSettings: (body: Record<string, unknown>) =>
    apiRequest<Saved<SettingsPayload>>('/admin/settings', { method: 'PUT', body }),

  // Recursos genéricos
  list: <T extends AdminRecord = AdminRecord>(resource: AdminResource, query: Query = {}) =>
    apiRequest<PageOf<T>>(`/admin/${resource}`, { query }),
  get: <T extends AdminRecord = AdminRecord>(resource: AdminResource, id: number) =>
    apiRequest<DataResponse<T>>(`/admin/${resource}/${id}`).then(unwrap),
  create: <T extends AdminRecord = AdminRecord>(resource: AdminResource, body: Record<string, unknown>) =>
    apiRequest<Saved<T>>(`/admin/${resource}`, { method: 'POST', body }),
  update: <T extends AdminRecord = AdminRecord>(resource: AdminResource, id: number, body: Record<string, unknown>) =>
    apiRequest<Saved<T>>(`/admin/${resource}/${id}`, { method: 'PATCH', body }),
  remove: (resource: AdminResource, id: number) =>
    apiRequest<{ message: string }>(`/admin/${resource}/${id}`, { method: 'DELETE' }),
  reorder: (resource: AdminResource, ids: number[], extra: Record<string, unknown> = {}) =>
    apiRequest<{ message: string }>(`/admin/${resource}/reorder`, { method: 'POST', body: { ids, ...extra } }),

  // Projectos: pré-visualização e galeria
  projectPreview: (id: number, lang: 'pt' | 'en') =>
    apiRequest<DataResponse<Project>>(`/admin/projects/${id}/preview`, { query: { lang } }).then(unwrap),
  addProjectImage: (id: number, mediaId: number) =>
    apiRequest<Saved<AdminProject>>(`/admin/projects/${id}/images`, { method: 'POST', body: { media_id: mediaId } }),
  updateProjectImage: (id: number, imageId: number, caption: Record<string, string>) =>
    apiRequest<Saved<AdminProject>>(`/admin/projects/${id}/images/${imageId}`, { method: 'PATCH', body: { caption } }),
  removeProjectImage: (id: number, imageId: number) =>
    apiRequest<Saved<AdminProject>>(`/admin/projects/${id}/images/${imageId}`, { method: 'DELETE' }),
  reorderProjectImages: (id: number, ids: number[]) =>
    apiRequest<Saved<AdminProject>>(`/admin/projects/${id}/images/reorder`, { method: 'POST', body: { ids } }),

  // Biblioteca de ficheiros
  media: (query: Query = {}) => apiRequest<PageOf<AdminMedia>>('/admin/media', { query }),
  uploadMedia: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<DataResponse<AdminMedia>>('/admin/media', { method: 'POST', body }).then(unwrap)
  },
  replaceMedia: (id: number, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<DataResponse<AdminMedia>>(`/admin/media/${id}/replace`, { method: 'POST', body }).then(unwrap)
  },
  updateMedia: (id: number, alt: Record<string, string>) =>
    apiRequest<DataResponse<AdminMedia>>(`/admin/media/${id}`, { method: 'PATCH', body: { alt } }).then(unwrap),
  removeMedia: (id: number, force = false) =>
    apiRequest<null>(`/admin/media/${id}`, { method: 'DELETE', query: force ? { force: 1 } : {} }),
}

/** Chaves de cache do backoffice. */
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  profile: ['admin', 'profile'] as const,
  settings: ['admin', 'settings'] as const,
  list: (resource: string, query: Query = {}) => ['admin', resource, 'list', query] as const,
  resource: (resource: string) => ['admin', resource] as const,
  record: (resource: string, id: number) => ['admin', resource, 'record', id] as const,
  media: ['admin', 'media'] as const,
}
