# Produção — guia de publicação e manutenção

> Não use `php artisan serve` nem `npm run dev` como alojamento: são servidores de desenvolvimento.

## Topologia recomendada

| Componente | Recomendação |
| --- | --- |
| Frontend | Ficheiros estáticos de `frontend/dist` servidos por Nginx (ou CDN), com *fallback* para `index.html` nas rotas do SPA |
| Backend | PHP-FPM 8.4 + Nginx a servir apenas `backend/public` |
| Base de dados | PostgreSQL 17 **sem porta exposta à Internet** (rede privada / `127.0.0.1`), utilizador próprio com permissões só sobre a base da aplicação |
| Fila | `php artisan queue:work` gerido por systemd ou Supervisor (envio de emails de recuperação de palavra-passe) |

**Mesma origem (mais simples):** `exemplo.co.mz` serve o frontend e encaminha `/api`, `/sanctum` e `/storage` para o Laravel. Não precisa de CORS.

**Subdomínio para a API:** `exemplo.co.mz` + `api.exemplo.co.mz`:

```dotenv
APP_URL=https://api.exemplo.co.mz
FRONTEND_URL=https://exemplo.co.mz
SANCTUM_STATEFUL_DOMAINS=exemplo.co.mz
SESSION_DOMAIN=.exemplo.co.mz
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

e no build do frontend `VITE_API_URL=https://api.exemplo.co.mz`.

## `.env` de produção (backend)

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://...
LOG_LEVEL=warning
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
DB_PASSWORD=<segredo>
```

- Segredos apenas no servidor (variáveis de ambiente ou `.env` com permissões `600`), nunca no Git.
- `php artisan key:generate` apenas uma vez; mudar a `APP_KEY` invalida sessões e os `ip_hash` existentes.

## Publicação de uma versão

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan storage:link
php artisan queue:restart
# frontend
npm ci && npm run build
```

`db:seed` só na primeira instalação (é idempotente, mas não deve correr em cada deploy).

## Primeira instalação no servidor (Linux)

```bash
# 1. Base de dados (no próprio servidor, sem porta pública)
sudo -u postgres psql -c "CREATE ROLE ashley LOGIN PASSWORD '<segredo>';"
sudo -u postgres psql -c "CREATE DATABASE ashley_portfolio OWNER ashley;"

# 2. Backend
cd /var/www/portfolio/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env            # preencher APP_URL, FRONTEND_URL, DB_*, MAIL_*, SANCTUM_STATEFUL_DOMAINS
php artisan key:generate        # apenas uma vez
php artisan migrate --force --seed
php artisan storage:link
php artisan admin:create        # conta do backoffice (palavra-passe forte)
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo chown -R www-data:www-data storage bootstrap/cache && chmod 600 .env

# 3. Frontend (pode ser construído noutra máquina e copiado)
cd ../frontend
npm ci
VITE_SITE_URL=https://exemplo.co.mz npm run build   # gera frontend/dist
```

## Nginx — exemplo (mesma origem)

```nginx
server {
    listen 443 ssl http2;
    server_name exemplo.co.mz;
    ssl_certificate     /etc/letsencrypt/live/exemplo.co.mz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exemplo.co.mz/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    client_max_body_size 12m;

    root /var/www/portfolio/frontend/dist;
    index index.html;

    # SPA: qualquer rota pública cai no index.html
    location / { try_files $uri /index.html; }

    # Laravel: API, Sanctum, sitemap e robots
    location ~ ^/(api|sanctum)/ { try_files $uri @laravel; }
    location = /sitemap.xml { try_files $uri @laravel; }
    location = /robots.txt  { try_files $uri @laravel; }
    location @laravel {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/portfolio/backend/public/index.php;
    }

    # Ficheiros carregados: servidos como estáticos, nunca executados
    location ^~ /storage/ {
        alias /var/www/portfolio/backend/storage/app/public/;
        try_files $uri =404;
    }
}

server { listen 80; server_name exemplo.co.mz; return 301 https://$host$request_uri; }
```

## Nginx — pontos essenciais

- HTTPS obrigatório (Let's Encrypt), redireccionar HTTP → HTTPS, HSTS.
- Frontend (SPA): servir `frontend/dist` com `try_files $uri /index.html;` para que `/projectos/...` e `/en/...` funcionem ao recarregar.
- Encaminhar para o Laravel: `/api/`, `/sanctum/`, `/storage/`, **`/sitemap.xml` e `/robots.txt`** (gerados a partir do conteúdo publicado). Não deixar um `robots.txt` estático no `dist`.
- `APP_ENV=production` é necessário para o `robots.txt` permitir a indexação (noutros ambientes bloqueia tudo).
- `root backend/public;` — nada fora de `public/` pode ser servido.
- Em `/storage/` desactivar a execução de PHP (`location ^~ /storage/ { try_files $uri =404; }`), `X-Content-Type-Options: nosniff`.
- `client_max_body_size 12m;` (alinha com o limite de 10 MB para PDF).
- Cabeçalhos: `X-Frame-Options: DENY` (ou CSP `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, CSP restrita às origens do site e da API.

## Permissões de ficheiros

O utilizador do PHP-FPM só precisa de escrita em `backend/storage` e `backend/bootstrap/cache`. O restante código deve ser apenas de leitura.

## Backups e recuperação

- `pg_dump` diário com retenção (ex.: 7 diários + 4 semanais), guardado fora do servidor e encriptado.
- Cópia de `backend/storage/app/public` (fotografias, CV, imagens) com a mesma periodicidade.
- Testar a reposição pelo menos uma vez antes de publicar e depois periodicamente.

## Actualizações e recuperação de falhas

1. Antes de actualizar: `pg_dump` da base e cópia de `storage/app/public`.
2. `php artisan down` → actualizar o código → passos de "Publicação de uma versão" → `php artisan up`.
3. Se algo falhar: repor a versão anterior do código, `php artisan migrate:rollback --step=1 --force` (só se a versão nova trouxe migrations) e, em último caso, repor o `pg_dump`.
4. Erros: `backend/storage/logs/laravel.log` (com `APP_DEBUG=false` os visitantes só vêem mensagens genéricas).
5. `GET /up` responde 200 quando a aplicação está de pé (útil para monitorização).

## Manutenção

- `composer audit` e `npm audit` regularmente; actualizações menores mensalmente.
- Rodar logs (`LOG_STACK=daily`); os logs não contêm palavras-passe nem tokens.
- Rever `activity_logs` e criar contas de administrador apenas com `php artisan admin:create`.
