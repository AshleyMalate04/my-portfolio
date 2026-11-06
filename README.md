# ASHLEY PORTFOLIO

Portfólio profissional de **Ashley da Amena Mario Malate** com backoffice para gerir todo o conteúdo.

| Pasta | Conteúdo |
| --- | --- |
| [`backend/`](backend) | Laravel 13 (PHP 8.4) — API REST `/api/v1`, autenticação Sanctum, regras de negócio, PostgreSQL |
| [`frontend/`](frontend) | React 19 + TypeScript + Vite 8 + Tailwind CSS 4 — site público (pt/en) e backoffice em `/admin` |
| [`docs/`](docs) | Arquitectura, modelo de dados, API e produção |
| `docker-compose.yml` | PostgreSQL 17 para desenvolvimento local |

**Estado:** Fases 1 a 4 concluídas (auditoria final em 2026-11-06). Funciona de ponta a ponta em desenvolvimento; antes de publicar, ver [Limitações conhecidas](#limitações-conhecidas) e o [guia de produção](docs/deployment.md).

**Contacto:** por decisão da dona do portfólio, o site **não tem formulário nem caixa de mensagens**. A última secção mostra os canais directos (WhatsApp, LinkedIn, GitHub, email, telefone) e o CV, geridos em *Perfil* e *Redes sociais*.

Documentação: [arquitectura e decisões](docs/architecture.md) · [API](docs/api.md) · [produção](docs/deployment.md)

---

## Instalação em Windows (VS Code)

### 1. Requisitos

| Ferramenta | Versão testada | Notas |
| --- | --- | --- |
| PHP | 8.4 | Extensões: `pdo_pgsql`, `pgsql`, `mbstring`, `fileinfo`, `gd`, `intl`, `zip`, `openssl` |
| Composer | 2.x | |
| Node.js | 24 LTS | inclui npm |
| PostgreSQL | 17 | Via Docker Desktop (recomendado) **ou** instalação nativa |
| Git | 2.x | |

Extensões úteis no VS Code: *PHP Intelephense*, *Laravel*, *Tailwind CSS IntelliSense*, *Prettier*, *oxc*.

### 2. Base de dados PostgreSQL

**Opção A — Docker (recomendada).** Na raiz do projecto:

```powershell
Copy-Item .env.example .env
# Edite .env e defina POSTGRES_PASSWORD com uma palavra-passe forte
docker compose up -d
```

O contentor expõe o PostgreSQL apenas em `127.0.0.1:5434` e cria as bases `ashley_portfolio` e `ashley_portfolio_test` (testes).

**Opção B — PostgreSQL instalado no Windows.** Com o `psql` (ou pgAdmin), como superutilizador:

```sql
CREATE ROLE ashley LOGIN PASSWORD 'defina-uma-palavra-passe-forte';
CREATE DATABASE ashley_portfolio OWNER ashley;
CREATE DATABASE ashley_portfolio_test OWNER ashley;
```

Depois use `DB_PORT=5432` no `backend/.env`.

### 3. Backend (Laravel)

Com a base de dados em execução (`docker compose up -d` na raiz, ou o serviço PostgreSQL do Windows):

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
# Edite .env: DB_PASSWORD (igual a POSTGRES_PASSWORD) e, se necessário, DB_PORT
php artisan migrate --seed
php artisan storage:link
php artisan admin:create
php artisan serve
```

- `migrate --seed` cria as tabelas e o conteúdo inicial (perfil, formação, competências, metodologia; projectos e serviços **em rascunho**). Pode voltar a executar `db:seed` sem apagar alterações feitas depois.
- `admin:create` pede nome, email e palavra-passe (mín. 12 caracteres com maiúsculas, minúsculas, números e símbolos). Não existem credenciais predefinidas nem registo público.
Campos do `backend/.env` a preencher:

| Variável | Valor |
| --- | --- |
| `APP_KEY` | Gerado por `php artisan key:generate` |
| `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | `5434` / `ashley_portfolio` / `ashley` / a mesma palavra-passe de `POSTGRES_PASSWORD` |
| `FRONTEND_URL` | `http://localhost:5173` (em produção, o domínio do site) |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173,127.0.0.1:5173` (em produção, o domínio do site) |
| `MAIL_*` | Opcional (ver passo 5) |

- `storage:link` torna `storage/app/public` acessível em `/storage`. No Windows pode exigir o *Modo de programador* activo ou um terminal como administrador.

A API fica em <http://127.0.0.1:8000/api/v1> (ex.: <http://127.0.0.1:8000/api/v1/profile?lang=en>).

### 4. Frontend (React)

Noutro terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # opcional: os valores por omissão servem para desenvolvimento
npm run dev
```

Abra <http://localhost:5173> (português) ou <http://localhost:5173/en> (inglês). Em desenvolvimento o Vite encaminha `/api`, `/sanctum`, `/storage`, `/sitemap.xml` e `/robots.txt` para o Laravel em `127.0.0.1:8000`, por isso frontend e API partilham a mesma origem.

### 5. Email (opcional)

Por omissão `MAIL_MAILER=log` (os emails vão para `backend/storage/logs/laravel.log`). Para activar a recuperação de palavra-passe do backoffice, configure SMTP no `backend/.env`:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.exemplo.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="no-reply@seudominio.co.mz"
```

O envio usa a fila de tarefas: mantenha `php artisan queue:work` em execução. A ligação de recuperação é válida durante 60 minutos. Sem SMTP, uma palavra-passe esquecida é redefinida com `php artisan admin:create`.

---

## Backoffice

1. Crie a conta com `php artisan admin:create` (não há registo público nem credenciais predefinidas).
2. Abra <http://localhost:5173/admin> e inicie sessão.
3. Comece por **Perfil** (fotografia, apresentação, contactos, CV), confirme os **Projectos** em rascunho e publique-os quando estiverem completos, e reveja **Serviços** e **Redes sociais**.

| Área | Endereço |
| --- | --- |
| Painel | `/admin` |
| Perfil, Definições | `/admin/perfil`, `/admin/definicoes` |
| Projectos (lista, novo, editar, pré-visualizar) | `/admin/projectos`, `/admin/projectos/novo`, `/admin/projectos/{id}`, `/admin/projectos/{id}/pre-visualizacao` |
| Competências, Serviços, Metodologia, Percurso, Testemunhos | `/admin/competencias`, `/admin/servicos`, `/admin/metodologia`, `/admin/percurso`, `/admin/testemunhos` |
| Tecnologias, Categorias, Redes sociais | `/admin/tecnologias`, `/admin/categorias`, `/admin/redes-sociais` |
| Biblioteca de ficheiros | `/admin/ficheiros` |
| Recuperação de palavra-passe (só com SMTP) | `/admin/recuperar-palavra-passe`, `/admin/redefinir-palavra-passe` |

As alterações publicadas aparecem no site sem recompilar o React (as leituras públicas têm cache HTTP de até 60 s).

## Comandos de verificação

```powershell
# Backend (usa a base ashley_portfolio_test)
cd backend
php artisan test
vendor/bin/pint --test

composer audit

# Frontend
cd frontend
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm audit
```

## Resolução de problemas

| Sintoma | Causa provável e solução |
| --- | --- |
| `Connection refused ... port 5434` | O PostgreSQL não está a correr: abra o Docker Desktop e execute `docker compose up -d` na raiz. |
| `failed to connect to the docker API` | O Docker Desktop está fechado. Abra-o e espere até ficar "running". |
| Site em branco ou "Algo correu mal" | O backend não está em `127.0.0.1:8000`. Inicie `php artisan serve` em `backend/`. |
| Login responde 419 / "A sessão expirou" | Cookies de outra origem: use sempre `http://localhost:5173` (não `127.0.0.1:5173`) ou acrescente a origem a `SANCTUM_STATEFUL_DOMAINS`. |
| Imagens com erro 404 | Falta `php artisan storage:link` (no Windows, terminal como administrador ou Modo de programador). |
| `Port 5173 is already in use` | Já existe um `npm run dev` aberto noutro terminal; use esse ou feche-o. |
| Alterações no backoffice não aparecem logo | Cache pública de até 60 s; recarregue após um minuto. |
| `php artisan test` falha a ligar | A base `ashley_portfolio_test` não existe (criada pelo Docker; na instalação nativa crie-a à mão). |

## Limitações conhecidas

- **SEO e pré-visualizações:** o site é um SPA. O Google indexa-o, mas as pré-visualizações de WhatsApp/LinkedIn mostram apenas o título e a descrição gerais do `index.html` (não os de cada projecto). Ver [docs/architecture.md](docs/architecture.md#seo-com-react--vite--o-que-existe-e-o-que-falta).
- **Email:** sem SMTP configurado, a recuperação de palavra-passe do backoffice não envia emails (`admin:create` redefine a palavra-passe).
- **Lint:** o projecto usa **oxlint** em vez de ESLint (o `typescript-eslint` não é compatível com o TypeScript 7).
- Não há estatísticas de visitas.

## Segurança — resumo

- Sessão por cookie HttpOnly (Laravel Sanctum, modo SPA) com protecção CSRF; nada de tokens em `localStorage`.
- Todas as rotas `/api/v1/admin/*` exigem sessão **e** conta administradora (Gate `access-admin`), verificadas no servidor.
- Rate limiting: login (5/min por email+IP, 20/min por IP), API geral (120/min).
- Uploads: tipo validado pelo conteúdo real, SVG recusado, nome gerado pelo servidor, extensão derivada do tipo, limites de tamanho e dimensões.
- Segredos só em `.env` (ignorado pelo Git); os `.env.example` não contêm credenciais.
