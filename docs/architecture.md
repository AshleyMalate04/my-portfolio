# Arquitectura e decisões técnicas

## Visão geral

```
Navegador ──► React (Vite)  ──fetch /api/v1──►  Laravel 13  ──Eloquent──►  PostgreSQL 17
                │                                   │
                └── cookies de sessão + XSRF ◄──────┘  Storage (disco "public") → /storage/...
```

- **Laravel é a fonte de verdade.** O React apenas consome a API; publicar algo no backoffice reflecte-se no site sem recompilar o frontend.
- **Uma única camada HTTP no frontend** (`frontend/src/lib/api/client.ts`): URL base, idioma, cookies, CSRF, conversão de erros em `ApiError`. Os endpoints estão em `lib/api/public.ts` e `lib/api/admin.ts`; as chaves de cache em `lib/api/queryKeys.ts`.

## Versões escolhidas (Outubro de 2026)

| Camada        | Escolha                                                                            | Motivo                                                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend       | Laravel 13.39, PHP 8.4                                                             | Versão estável actual; atributos `#[Fillable]`, `#[Scope]`                                                                                                                                                                |
| Autenticação  | Laravel Sanctum 4 (modo SPA, sessão)                                               | Aplicação de primeira parte: cookies HttpOnly são mais seguros do que tokens no navegador                                                                                                                                 |
| Base de dados | PostgreSQL 17                                                                      | JSONB para traduções, chaves estrangeiras e índices reais                                                                                                                                                                 |
| Frontend      | React 19, Vite 8, TypeScript 7                                                     | Pedido no enunciado; TS 7 é o compilador nativo, muito mais rápido                                                                                                                                                        |
| Estilos       | Tailwind CSS 4 (`@theme`)                                                          | Tokens de design em CSS, sem ficheiro de configuração JS                                                                                                                                                                  |
| Dados remotos | TanStack Query 5                                                                   | Cache, estados de carregamento/erro e novas tentativas sem código repetido                                                                                                                                                |
| Rotas         | React Router 8                                                                     |                                                                                                                                                                                                                           |
| Formulários   | React Hook Form (backoffice)                                                       |                                                                                                                                                                                                                           |
| Animação      | Motion (instalado para a Fase 2)                                                   | Respeita `prefers-reduced-motion`                                                                                                                                                                                         |
| Tipografia    | Bricolage Grotesque (títulos), DM Sans (texto), JetBrains Mono (detalhes técnicos) | Licença SIL OFL; servidas localmente via Fontsource (sem pedidos ao Google)                                                                                                                                               |
| Lint          | **oxlint** (em vez de ESLint)                                                      | O `typescript-eslint` depende da API JavaScript do compilador TypeScript, que o TS 7 deixou de expor. O oxlint é o linter que o próprio Vite configura, compatível com as regras ESLint usadas (react, hooks, typescript) |
| Formatação    | Prettier (frontend), Pint (backend)                                                |                                                                                                                                                                                                                           |
| Testes        | PHPUnit 12 (contra PostgreSQL real), Vitest 5 + Testing Library                    |                                                                                                                                                                                                                           |

## Internacionalização

- **Conteúdo editável** (perfil, projectos, competências...) é guardado em colunas **JSONB** no formato `{"pt": "...", "en": "..."}`. O trait `App\Models\Concerns\HasTranslations` resolve o idioma pedido e **recorre ao português** quando a tradução está vazia — uma página em inglês nunca fica em branco.
- **Idioma de um pedido à API**: apenas o parâmetro `?lang=pt|en` (ignora-se `Accept-Language` de propósito: respostas determinísticas, cacheáveis e coerentes com o URL). A resposta indica `Content-Language`.
- **Textos fixos da interface** estão em `frontend/src/i18n/messages.ts`, com tipagem que obriga o inglês a ter as mesmas chaves do português (há um teste para isso).
- **URLs**: português na raiz (`/`), inglês com prefixo (`/en`). Bom para SEO (URLs distintos por idioma, prontos para `hreflang`).
- Os slugs são únicos e partilhados entre idiomas (simplicidade); pode evoluir para slugs traduzidos se necessário.
- Para acrescentar um idioma: `config/portfolio.php` → `locales`, `frontend/src/i18n/locales.ts` e `messages.ts`.

## Modelo de dados

Tabelas próprias (além de `users`, `sessions`, `cache`, `jobs` do Laravel):

| Tabela                                        | Notas                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                                       | + `is_admin` (não atribuível em massa), `last_login_at`                                                                                                                                                                                                                              |
| `media`                                       | Biblioteca multimédia: disco, caminho único, MIME real, tamanho, dimensões, `alt` traduzível, checksum SHA-256, `uploaded_by`                                                                                                                                                        |
| `profiles`                                    | Registo único: nome, título, bios, frases do hero, interesses, abordagem, objectivos, contactos públicos, disponibilidade (só visível com `show_availability`), FKs para fotografia, imagem do hero e CV                                                                             |
| `site_settings`                               | Chave/valor JSONB com `is_public` (nome do site, SEO, CTA, nota de privacidade, visibilidade das secções, ids de logótipo/favicon/imagem de partilha)                                                                                                                                |
| `project_categories`                          | slug único, nome traduzível, ordem                                                                                                                                                                                                                                                   |
| `projects`                                    | slug único, textos traduzíveis (resumo, descrição, problema, solução, contribuição, funcionalidades, resultados, SEO), `project_status` (estado do projecto) separado de `publication_status` (rascunho/publicado), destaque, ordem, período, links, capa, `internal_notes` privadas |
| `technologies`                                | nome/slug únicos                                                                                                                                                                                                                                                                     |
| `project_technology`                          | N:N com ordem (chave primária composta)                                                                                                                                                                                                                                              |
| `project_images`                              | Galeria: projecto × media, legenda traduzível, ordem (único por par)                                                                                                                                                                                                                 |
| `skill_categories`, `skills`                  | Competências agrupadas, opcionalmente ligadas a uma tecnologia; sem percentagens                                                                                                                                                                                                     |
| `educations`, `experiences`, `certifications` | Percurso; `certifications.kind` distingue curso/certificação                                                                                                                                                                                                                         |
| `services`, `process_steps`                   | Serviços (ícone Lucide por nome) e metodologia de trabalho                                                                                                                                                                                                                           |
| `social_links`                                | Plataforma, rótulo, URL                                                                                                                                                                                                                                                              |
| `testimonials`                                | Só públicos com `is_published` **e** `consent_confirmed`                                                                                                                                                                                                                             |
| `activity_logs`                               | Acções administrativas (login, uploads, eliminações) sem segredos                                                                                                                                                                                                                    |

Regras gerais: conteúdos públicos usam `is_published` (ou `publication_status` nos projectos) + `sort_order`; enums PHP (`app/Enums`) guardados como texto para facilitar a evolução.

### Estratégia para ficheiros

- Todas as referências a `media` usam `ON DELETE SET NULL` (perfil, capa, certificados, testemunhos) ou `CASCADE` (imagens da galeria). Eliminar um ficheiro **nunca** deixa referências inválidas.
- Antes de eliminar, a API verifica se o ficheiro está em uso e devolve **409** até a eliminação ser confirmada (`?force=1`).
- O ficheiro físico só é apagado **depois do commit** da transacção (`DB::afterCommit`), evitando inconsistências entre disco e base de dados.
- Se gravar o registo falhar depois de escrever o ficheiro, o ficheiro é removido.

## Segurança — decisões relevantes

- **CSRF**: o Laravel 13 usa `PreventRequestForgery`, que aceita pedidos com `Sec-Fetch-Site: same-origin` (cabeçalho definido pelo navegador) e exige o token `X-XSRF-TOKEN` nos restantes. Verificado: pedidos _cross-site_ e _same-site_ sem token recebem 419. O cliente React envia sempre o token, por isso também funciona com a API num subdomínio.
- **Login** só a partir do frontend autorizado (pedido com sessão); responde 400 caso contrário. A sessão é regenerada após o login e invalidada no logout. A mesma mensagem de erro para email inexistente, palavra-passe errada ou conta não administradora.
- **Modo estrito do Eloquent** em desenvolvimento/testes: falha perante _lazy loading_, atributos inexistentes e atribuição em massa ignorada.
- **Erros da API** com formato `{"message": "..."}` (e `errors` na validação), sem _stack traces_ fora de `APP_DEBUG=true`.

## Website público (Fase 2)

### Rotas

| Português           | Inglês                | Conteúdo                                                                                                                |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/`                 | `/en`                 | Página inicial com todas as secções (âncoras `#sobre`, `#projectos`, `#contacto`… / `#about`, `#projects`, `#contact`…) |
| `/projectos`        | `/en/projects`        | Todos os projectos publicados; filtros `?categoria=`, `?tecnologia=`, `?pagina=` na URL                                 |
| `/projectos/{slug}` | `/en/projects/{slug}` | Detalhe do projecto (404 se não existir ou não estiver publicado)                                                       |

Os segmentos estão em `frontend/src/routes/paths.ts` e têm de coincidir com `public_paths` em `backend/config/portfolio.php` (usado no sitemap). O selector de idioma mantém a página actual.

### Estrutura do frontend

- `src/sections/` — secções da página inicial (hero, sobre, competências, projectos, serviços, metodologia, percurso, testemunhos, contacto).
- `src/pages/public/` — página inicial, lista e detalhe de projectos.
- `src/components/` — peças reutilizáveis: `ui/` (botões, cabeçalhos de secção, imagens, grafismos), `projects/`, `motion/` (animações), `seo/useSeo.ts`.
- `src/layouts/` — cabeçalho (menu mobile acessível), rodapé e layout público.
- `src/hooks/useHomeData.ts` — um único pedido `GET /home` alimenta a navegação, o rodapé e todas as secções; `visibleSections()` decide o que aparece.

### Regras de conteúdo aplicadas na interface

- Uma secção (e a respectiva entrada na navegação) só aparece se estiver activa em `site_settings.sections` **e** tiver conteúdo publicado. Testemunhos ficam ocultos sem testemunhos autorizados.
- Sem projectos publicados, a secção mostra um estado vazio honesto e o botão "Explorar projectos" do hero não aparece.
- Ligações (demonstração, repositório, credenciais, redes sociais, CV) só aparecem quando existem e usam esquemas seguros (`http`, `https`, `mailto`, `tel`); `javascript:` e outros são ignorados.
- O estado do projecto (`Conceito`, `Em desenvolvimento`, …) é sempre mostrado tal como está no backend.
- Sem fotografia, o hero mostra uma composição gráfica com as iniciais (nunca uma pessoa gerada).
- Hero em ecrãs estreitos (< 1024 px): a fotografia (imagem do hero ou fotografia de perfil) é o fundo, com uma camada escura e o texto por cima. Ao fazer scroll o texto desvanece primeiro e a camada escura a seguir, deixando a fotografia limpa. A altura do hero é a de um ecrã e não aumenta: a fotografia fica parada (`position: fixed`, cortada ao hero por `clip-path`) e a secção passa por cima. Com movimento reduzido o efeito não se aplica (camada e texto ficam estáticos). Sem fotografia usa-se a composição gráfica com as iniciais.
- A secção "Percurso" está oculta por agora (comentada em `pages/public/HomePage.tsx` e no menu em `layouts/PublicLayout.tsx`); os dados continuam geridos em `/admin/percurso`.
- Logo a seguir ao hero há uma faixa coral em movimento com as tecnologias (`components/ui/TechMarquee.tsx`, vindas das competências publicadas; pára com o rato por cima e fica estática com movimento reduzido). A secção "Projectos" só aparece quando há pelo menos um projecto publicado.
- Não há rodapé: a página termina na secção de contacto — uma frase em destaque (`contact_headline`, editável em Definições) seguida dos canais directos (WhatsApp, LinkedIn, GitHub, email, telefone, vindos do Perfil e das Redes sociais) e do botão de download do CV. Não há formulário nem mensagens: quem quiser falar usa os canais directos.
- A apresentação curta aparece no hero; "Sobre mim" usa apenas a biografia longa, abordagem e objectivos (sem repetir texto). Enquanto estiverem vazios, mostra os interesses e a formação.

### Movimento e acessibilidade

- Motion (`LazyMotion` + `domAnimation`) para a entrada do hero, revelação no scroll e transição de páginas; CSS para _hover_ e microinteracções.
- Animações em `frontend/src/components/motion/`:
  - **Bolhas e partículas** — `Bubbles` (hero e contacto): bolhas que sobem devagar em planos diferentes (tamanho, desfoque e opacidade variam com a profundidade); `FloatingField` (orbes) e `FleeingMarks` (marcas que fogem do rato). Só CSS/`transform`; metade das bolhas fica oculta em ecrãs pequenos.
  - **Cursor interactivo** — `Magnetic` nos botões do hero, `Tilt` nos cartões de projecto, `FleeingMarks` e o peso das letras do nome (`KineticText`) reagem ao rato. Só com rato (`pointer: fine`); o cursor do sistema nunca é escondido.
  - **Tipografia cinética** — `KineticText` no nome do hero (letras surgem uma a uma e o peso da fonte variável muda junto ao cursor; em ecrãs tácteis, uma onda única); `TypewriterText` (frases que se escrevem); `TextReveal` (títulos palavra a palavra).
  - **Scroll e profundidade** — `ScrollDepth` (cartões de projectos e testemunhos a velocidades diferentes, barra dos cabeçalhos a deslizar), `Reveal` com entradas laterais, faixa de tecnologias que também desliza com o scroll, efeito do hero em telemóvel.
- Com `prefers-reduced-motion`, nenhuma destas animações é aplicada (bolhas e profundidade não são renderizadas; o texto cinético é texto simples): o conteúdo aparece imediatamente (nada fica escondido à espera de uma animação). Os testes correm neste modo.
- Ligação "Saltar para o conteúdo", foco visível, foco movido para o conteúdo ao mudar de página, menu mobile com `aria-expanded`/`aria-controls` e Escape, alvos de toque ≥ 44 px, erros dos formulários do backoffice ligados por `aria-describedby`, campos de palavra-passe com botão para mostrar/esconder.

### Performance

- Leituras públicas **sem sessão** (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`): o Sanctum não cria uma sessão na base de dados por visitante, e a API responde com `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Consequência: alterações no backoffice podem demorar até 1 minuto a aparecer a quem já tem a página em cache.
- Página inicial com um único pedido (`/home`).
- _Code splitting_: lista e detalhe de projectos e o backoffice (React Hook Form) são carregados a pedido. Bundle inicial ≈ 165 kB gzip.
- Imagens com `width`/`height` explícitos, `loading="lazy"` fora do primeiro ecrã, `fetchpriority="high"` no hero.
- Fontes servidas localmente (Fontsource), sem pedidos a terceiros.

## Backoffice (Fase 3)

### Backend

- `app/Http/Controllers/Api/V1/Admin/CrudController.php` — base comum dos recursos: listagem com pesquisa (`?q=` em texto e JSONB traduzível), filtros, paginação, criação/edição em transacção, eliminação, ordenação manual e registo de actividade. Cada recurso (`Admin/Content/*Controller.php`) declara apenas o modelo, o Form Request e eventuais regras próprias.
- Um Form Request por recurso (`app/Http/Requests/Api/V1/Admin/Content`), sobre `AdminFormRequest`: exige administrador; ao criar os campos obrigatórios são exigidos, ao editar (`PATCH`) são opcionais — permite publicar/ocultar sem reenviar o registo.
- `App\Support\Translatable` gera as regras dos campos `{pt, en}` (português obrigatório quando o campo é obrigatório) e limpa traduções vazias antes de gravar.
- `App\Rules\MediaOfKind` garante que um campo de ficheiro aponta para um ficheiro existente do tipo certo (fotografia → imagem, CV → PDF).
- `MediaService`: carregamento, substituição (mantém o id e as referências), lista de utilizações e eliminação que limpa também as definições do site.
- Recuperação de palavra-passe com o broker do Laravel; a ligação aponta para `/admin/redefinir-palavra-passe` no frontend. Desactivada quando `MAIL_MAILER` é `log` ou `array`.

### Frontend (`frontend/src/features/admin`)

- Todo o backoffice é carregado a pedido (não entra no bundle do site público).
- `AdminRoot` (notificações, confirmações, `noindex`, sessão expirada) → `AdminShell` (sidebar, cabeçalho, `RequireAdmin`) → páginas.
- **Colecções orientadas por configuração** (`collections/configs.tsx` + `CollectionPage`): competências, serviços, metodologia, percurso, testemunhos, tecnologias, categorias e redes sociais partilham lista, pesquisa, publicar/ocultar, ordenação (botões subir/descer, acessíveis por teclado), edição em janela modal e eliminação com confirmação. Acrescentar um campo é acrescentar uma linha de configuração.
- Páginas dedicadas: painel, perfil, definições (incluindo alteração da palavra-passe), projectos (lista, editor por secções com tecnologias, capa, galeria, SEO e notas internas; pré-visualização com os componentes do site público) e biblioteca de ficheiros.
- Formulários: React Hook Form; os erros de validação do Laravel (`title.pt`, `slug`…) são colocados nos campos correspondentes. Barra de gravação fixa com indicação de alterações por guardar, e aviso ao sair da página (navegação interna e fecho do separador).
- Sessão: qualquer 401 num pedido administrativo (excepto a verificação inicial) redirecciona para o login com a mensagem “A sessão expirou”.
- Nada do conteúdo editável é interpretado como HTML no site.

### Decisões

- **Formação e especialidade** ficam em _Percurso_ (uma única fonte), e não duplicadas no perfil; a página de perfil aponta para lá.
- **Ficheiros**: todos os ficheiros carregados são públicos (fotografias, capas, CV, certificados). Não há, por agora, ficheiros privados; se forem necessários, devem usar um disco não público e uma rota autenticada de download.
- **Sem estatísticas de tráfego**: não há integração de análise configurada, por isso o painel não mostra visitas.

## SEO com React + Vite — o que existe e o que falta

**Implementado:** título, descrição, canonical, `hreflang` (pt-MZ, en, x-default), Open Graph e Twitter Card por página; JSON-LD `Person` na página inicial e `CreativeWork` em cada projecto; `noindex` em 404 e no backoffice; URLs legíveis com slugs; `sitemap.xml` com todos os projectos publicados nos dois idiomas e `robots.txt` gerados pelo Laravel (fora de produção o robots bloqueia tudo, para ambientes de teste não serem indexados).

**Limitação real:** estes metadados são definidos por JavaScript depois de a página carregar. O HTML inicial servido é o mesmo `index.html` para todas as URLs. O Google executa JavaScript e consegue indexar o conteúdo, mas:

- pré-visualizações em WhatsApp, LinkedIn, Facebook, X, etc. **não** executam JavaScript e mostram apenas o título/descrição genéricos do `index.html`;
- outros motores de busca podem indexar pior;
- a indexação depende da API estar disponível no momento do rastreio.

**Mitigação aplicada:** o `index.html` traz `og:title`, `og:description`, `og:type` e `twitter:card` por omissão, por isso a partilha da página inicial já mostra o nome e a descrição certos.

**Melhoria ainda necessária:** pré-renderizar as rotas públicas no build ou no servidor — por exemplo, um passo pós-build que, com a lista de URLs do `sitemap.xml`, gera um HTML por página com os metadados e o conteúdo já preenchidos; ou o Laravel servir o `index.html` com os `<meta>` injectados por URL. Até lá, o SEO **não** deve ser considerado resolvido.
