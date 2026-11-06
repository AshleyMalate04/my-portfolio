# API REST — `/api/v1`

- Respostas JSON com envelope `data` (listas paginadas acrescentam `links` e `meta`).
- Idioma: `?lang=pt` (omissão) ou `?lang=en`. Textos sem tradução recorrem ao português. Cabeçalho de resposta `Content-Language`.
- Erros: `{"message": "..."}`; validação (422) acrescenta `{"errors": {"campo": ["..."]}}`.

| Código | Significado |
| --- | --- |
| 200 / 201 / 204 | Sucesso / criado / sem conteúdo |
| 400 | Login fora do frontend autorizado |
| 401 | Sem sessão ou sessão expirada |
| 403 | Sem permissão (conta não administradora) |
| 404 | Recurso inexistente **ou não publicado** |
| 409 | Ficheiro em uso (confirmar com `?force=1`) |
| 419 | Token CSRF em falta ou expirado |
| 422 | Dados inválidos |
| 429 | Demasiados pedidos (cabeçalho `Retry-After`) |

## Pública

Só devolve conteúdo publicado e campos necessários (nunca `internal_notes` nem IDs de utilizadores).
As leituras (`GET`) sem cookies respondem com `Cache-Control: public, max-age=60, stale-while-revalidate=300`.

| Método | Caminho | Descrição |
| --- | --- | --- |
| GET | `/home` | Tudo o que a página inicial precisa num pedido: `settings`, `profile` (ou `null`), `projects: { items (até 6), total }`, `project_categories`, `skills`, `journey`, `services`, `process_steps`, `testimonials`, `social_links` |
| GET | `/site` | Definições públicas do site, idioma actual e idiomas disponíveis. Chaves `*_media_id` são devolvidas resolvidas (ex.: `og_image: { url, width, height, mime_type }`) |
| GET | `/profile` | Perfil profissional (404 se ainda não existir) |
| GET | `/projects` | Projectos publicados, paginados. Filtros: `category`, `technology` (slugs), `featured=1`, `page`, `per_page` (1–50, omissão 12) |
| GET | `/projects/{slug}` | Detalhe com descrição, problema, objectivo, solução, contribuição, desafios, funcionalidades, resultados, galeria, SEO |
| GET | `/project-categories` | Categorias com pelo menos um projecto publicado (+ `projects_count`) |
| GET | `/skills` | Categorias publicadas com as competências publicadas |
| GET | `/technologies` | Tecnologias usadas em projectos ou competências publicados |
| GET | `/journey` | `{ education, experience, certifications }` |
| GET | `/services` | Serviços publicados |
| GET | `/process-steps` | Etapas da metodologia |
| GET | `/testimonials` | Testemunhos publicados **e** autorizados |
| GET | `/social-links` | Redes sociais configuradas e publicadas |

### Exemplo — `GET /api/v1/profile?lang=en`

```json
{
  "data": {
    "full_name": "Ashley da Amena Mario Malate",
    "display_name": "Ashley da Amena Mario Malate",
    "headline": "Computer Science student and software developer",
    "short_bio": "Computer Science undergraduate at Universidade Pedagógica de Maputo, …",
    "hero_phrases": [],
    "interests": ["Web and mobile application development", "Frontend", "…"],
    "location": "Maputo, Moçambique",
    "public_email": null,
    "photo": null,
    "hero_image": null,
    "cv_url": null
  }
}
```

`availability` só aparece quando `show_availability` está activo no backoffice.

## Backoffice (`/admin`)

Autenticação por sessão Sanctum (SPA). Fluxo: `GET /sanctum/csrf-cookie` → `POST /api/v1/admin/auth/login` → pedidos seguintes com cookies e `X-XSRF-TOKEN`. Todas as rotas abaixo exigem `auth:sanctum` + `can:access-admin`, **excepto** as quatro primeiras. Um teste automático (`AdminAccessTest`) percorre todas as rotas `api.v1.admin.*` e confirma 401 para visitantes e 403 para contas não administradoras.

Respostas de escrita: `{ "data": { … }, "message": "Alterações guardadas." }`. Os registos vêm com as traduções completas (`{"pt": …, "en": …}`); traduções vazias são gravadas como ausentes.

### Autenticação

| Método | Caminho | Descrição |
| --- | --- | --- |
| POST | `/admin/auth/login` | `{ email, password, remember? }`. 5 tentativas/min por email+IP, 20/min por IP |
| GET | `/admin/auth/options` | `{ password_reset: bool }` — recuperação só disponível com SMTP configurado |
| POST | `/admin/auth/forgot-password` | `{ email }`. Resposta igual exista ou não a conta; só administradores recebem a ligação. 503 sem SMTP |
| POST | `/admin/auth/reset-password` | `{ token, email, password, password_confirmation }` |
| GET | `/admin/auth/me` | Administrador da sessão |
| POST | `/admin/auth/logout` | Termina e invalida a sessão |
| PUT | `/admin/auth/password` | `{ current_password, password, password_confirmation }` |

### Painel, perfil e definições

| Método | Caminho | Descrição |
| --- | --- | --- |
| GET | `/admin/dashboard/summary` | Totais reais (projectos, competências, serviços, ficheiros, testemunhos por publicar) e alterações recentes |
| GET / PUT | `/admin/profile` | Perfil completo; `photo_media_id`/`hero_media_id` têm de ser imagens e `cv_media_id` um PDF |
| GET / PUT | `/admin/settings` | `{ values, media }`. Chaves aceites (lista fechada): `site_name`, `brand_wordmark`, `site_tagline`, `seo_title`, `seo_description`, `primary_cta_label`, `logo_media_id`, `favicon_media_id`, `og_image_media_id`, `sections` (junta com o valor actual) |

### Recursos com CRUD

Para cada recurso: `GET /admin/{recurso}` (`?q=` pesquisa, filtros, `per_page` ≤ 100), `POST`, `GET /{id}`, `PUT|PATCH /{id}` (PATCH aceita alterações parciais, ex.: `{"is_published": true}`), `DELETE /{id}` e `POST /{recurso}/reorder` com `{ ids: [...] }` pela nova ordem.

| Recurso | Notas |
| --- | --- |
| `projects` | Filtros `publication_status`, `project_category_id`, `is_featured`. Campos: traduções (título, resumo, descrição, problema, objectivo, solução, contribuição, desafios, resultados, SEO), `features` (lista), `technology_ids` (ordem = ordem no site), `cover_media_id` (imagem), datas, links http(s), `internal_notes` (nunca públicas). `published_at` é definido na primeira publicação |
| `projects/{id}/preview` | Formato público, para qualquer estado (`?lang=en`) |
| `projects/{id}/images` | `POST { media_id }`, `PATCH /{imageId} { caption }`, `DELETE /{imageId}` (o ficheiro fica na biblioteca), `POST /reorder { ids }` |
| `project-categories`, `technologies` | Slugs únicos; tecnologias sem ordenação manual |
| `skill-categories`, `skills` | Competências filtráveis por `skill_category_id`; a ordenação exige `skill_category_id` (ordem dentro da categoria). Não é possível apagar uma categoria com competências |
| `educations`, `experiences`, `certifications` | `ended_at ≥ started_at`; certificado em PDF (`document_media_id`) |
| `services`, `process-steps` | Ícone de serviço numa lista fechada |
| `social-links` | Apenas `http(s)://`; para a plataforma email, `mailto:` |
| `testimonials` | Publicar exige `consent_confirmed` (também em edições parciais) |

### Biblioteca de ficheiros

| Método | Caminho | Descrição |
| --- | --- | --- |
| GET | `/admin/media` | `?kind=image|document`, `?q=` (nome ou texto alternativo). Cada ficheiro inclui `usage` (onde é usado) |
| POST | `/admin/media` | `multipart/form-data`: `file` (JPEG, PNG, WebP, AVIF ≤ 5 MB; PDF ≤ 10 MB) — tipo verificado pelo conteúdo |
| GET / PATCH | `/admin/media/{id}` | Detalhe com utilizações / editar `alt` |
| POST | `/admin/media/{id}/replace` | Novo ficheiro do mesmo tipo; o id mantém-se, todas as referências passam a mostrar a nova versão e o ficheiro antigo é apagado |
| DELETE | `/admin/media/{id}` | 409 com a lista `usage` se estiver em uso; `?force=1` elimina e limpa as referências (incluindo definições do site) |

## Fora da API (raiz do backend)

| Caminho | Descrição |
| --- | --- |
| `/sitemap.xml` | Início e lista de projectos + cada projecto publicado, nos dois idiomas, com `hreflang` e `lastmod`. URLs construídas a partir de `FRONTEND_URL` |
| `/robots.txt` | Em produção: `Disallow: /admin`; noutros ambientes: `Disallow: /`. Indica o sitemap |

Em desenvolvimento o Vite encaminha estes caminhos para o Laravel; em produção o servidor web deve fazer o mesmo (ver `docs/deployment.md`).
