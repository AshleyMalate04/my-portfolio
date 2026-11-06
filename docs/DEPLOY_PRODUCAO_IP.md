# Colocar o ASHLEY PORTFOLIO em produção (só com IP público, sem domínio)

Guia passo a passo, feito para **este projecto**: Laravel 13 (PHP 8.4) + React/Vite + PostgreSQL 17, autenticação Sanctum por cookie.
Complementa `docs/deployment.md` (que assume que já existe um domínio).

> Substitua **`SEU_IP`** pelo IP público do servidor em todos os comandos e ficheiros.

---

## 0. Decisões tomadas (leia primeiro)

| Tema | Decisão | Porquê |
| --- | --- | --- |
| Sistema | Ubuntu Server 24.04 ou 26.04 LTS | Os comandos servem para as duas (as diferenças estão assinaladas) |
| Arquitectura | **Mesma origem**: o Nginx serve o React e encaminha `/api`, `/sanctum`, `/storage`, `/sitemap.xml`, `/robots.txt`, `/up` para o Laravel | Sem CORS, cookies de sessão simples |
| Base de dados | PostgreSQL 17 instalado no próprio servidor, só em `127.0.0.1` | O `docker-compose.yml` do projecto é só para desenvolvimento |
| HTTPS sem domínio | **Certificado Let's Encrypt para o IP** (validade de ~6 dias, renovação automática) | Evita enviar a palavra-passe do backoffice em texto simples |
| Fila | `queue:work` opcional | Só é necessária se configurar SMTP (recuperação de palavra-passe) |
| Agendador (cron do Laravel) | Não é preciso | `routes/console.php` não tem tarefas agendadas |

**Requisitos do IP** (confirme antes de começar):

1. É **fixo** (se mudar, o certificado e o site deixam de funcionar).
2. As portas **80 e 443** estão abertas de fora para dentro. Se o servidor está em casa/escritório, faça *port forwarding* no router; operadoras com CGNAT não permitem. Num VPS, abra-as também no firewall do painel do fornecedor.
3. O Let's Encrypt valida o IP por HTTP na porta 80, por isso ela tem de ficar acessível.

**Se o servidor é uma instância AWS EC2:**

- Associe um **Elastic IP** à instância (EC2 → Elastic IPs → Allocate → Associate). O IP público normal muda quando a instância é parada e iniciada, e o site e o certificado deixariam de funcionar. Use o Elastic IP como `SEU_IP`.
- No **Security Group** da instância, abra as portas de entrada **80** e **443** (origem `0.0.0.0/0`) e deixe a 22 só para o seu IP. O `ufw` do Ubuntu não chega: o Security Group bloqueia antes.
- O utilizador por omissão é `ubuntu`. Pode usá-lo em vez de criar `deploy`: onde o guia diz `deploy`, escreva `ubuntu` (e salte a secção 2.1).

---

## 1. Preparar o projecto no seu PC (Windows)

### 1.1 Testes e qualidade

```powershell
cd backend
php artisan test
vendor/bin/pint --test
composer audit

cd ..\frontend
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

Só avance se tudo passar.

### 1.2 O que NUNCA vai para o servidor

- `.env` (raiz e `backend/`): têm as suas palavras-passe locais. O `.gitignore` já os exclui.
- `backend/vendor/` e `frontend/node_modules/`: reinstalam-se no servidor.
- `backend/storage/logs/laravel.log` (já tem ~780 KB de logs de desenvolvimento).
- `backend/public/storage`: é um atalho (symlink) do Windows; no servidor cria-se de novo.

### 1.3 Enviar o código por Git (recomendado)

Crie um repositório **privado** (GitHub/GitLab) e envie o projecto:

```powershell
git init            # se ainda não for um repositório
git add .
git status          # CONFIRME que nenhum .env aparece na lista
git commit -m "Versão para produção"
git remote add origin git@github.com:SEU_UTILIZADOR/ashley-portfolio.git
git push -u origin main
```

Se `git status` mostrar algum `.env`, pare e corrija o `.gitignore` antes de continuar.

---

## 2. Preparar o servidor

### 2.1 Primeiro acesso e utilizador de trabalho

```bash
ssh root@SEU_IP

adduser deploy                      # defina uma palavra-passe forte
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copia a sua chave SSH (se entrou com chave)
```

Abra **outro terminal** e confirme que `ssh deploy@SEU_IP` funciona. Só depois continue como `deploy`.

### 2.2 Actualizar, firewall e SSH

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ufw fail2ban unattended-upgrades git curl unzip

# Firewall: permitir SSH ANTES de activar
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Depois de confirmar que entra por chave SSH, desactive o login por palavra-passe:

```bash
sudo nano /etc/ssh/sshd_config.d/99-hardening.conf
```
```
PasswordAuthentication no
PermitRootLogin no
```
```bash
sudo systemctl restart ssh
```

> A porta 5432 (PostgreSQL) **não** é aberta no firewall. A base de dados nunca fica exposta.

### 2.3 (Só se o servidor tiver ≤ 1 GB de RAM) Swap

O `composer install` e o `npm run build` podem ficar sem memória.

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Instalar o software

### 3.1 Nginx

```bash
sudo apt -y install nginx
sudo systemctl enable --now nginx
```

### 3.2 PHP 8.4

O projecto foi testado com PHP 8.4. A Ubuntu 24.04 traz a 8.3 e a 26.04 traz a 8.5, por isso instala-se a 8.4 pelo repositório `packages.sury.org`.

> **Ubuntu 26.04 ("resolute"):** o antigo PPA `ppa:ondrej/php` **já não funciona** nesta versão e dá o erro `does not have a Release file` (404). Não use `add-apt-repository`. Se já o executou, limpe primeiro:
>
> ```bash
> sudo rm -f /etc/apt/sources.list.d/ondrej-ubuntu-php-resolute.sources
> sudo apt update          # já não deve mostrar o erro do PPA
> ```

```bash
sudo apt -y install ca-certificates curl
sudo curl -fsSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg
. /etc/os-release       # define VERSION_CODENAME (resolute, noble, ...)
printf '%s\n' 'Types: deb' 'URIs: https://packages.sury.org/php/' "Suites: $VERSION_CODENAME" \
  'Components: main' 'Signed-By: /usr/share/keyrings/deb.sury.org-php.gpg' \
  | sudo tee /etc/apt/sources.list.d/php.sources
sudo apt update
apt-cache policy php8.4-fpm       # o "Candidate" tem de vir de packages.sury.org
sudo apt -y install php8.4-fpm php8.4-cli php8.4-pgsql php8.4-mbstring php8.4-xml \
     php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-bcmath
php -v
```

**Limites de upload (obrigatório).** O backoffice aceita imagens até 5 MB e PDF até 10 MB, mas o PHP por omissão só aceita 2 MB; sem isto os uploads falham.

```bash
sudo tee /etc/php/8.4/fpm/conf.d/99-portfolio.ini >/dev/null <<'EOF'
upload_max_filesize = 12M
post_max_size = 14M
memory_limit = 256M
expose_php = Off
EOF
sudo systemctl restart php8.4-fpm
```

### 3.3 Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 3.4 Node.js 24 (para compilar o frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs
node -v && npm -v
```

> Se o servidor for pequeno, pode compilar o frontend no seu PC (`npm run build`) e enviar só a pasta `dist` com `scp` (ver 7.2) e dispensar este passo.

### 3.5 PostgreSQL 17

```bash
sudo apt -y install postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh   # adiciona o repositório oficial
sudo apt -y install postgresql-17
sudo systemctl enable --now postgresql
```

> Na Ubuntu 26.04 o PostgreSQL por omissão pode ser outra versão. O repositório oficial (PGDG) deve ter a 17; confirme com `apt-cache policy postgresql-17`. Se o `apt install postgresql-17` falhar, cole aqui o erro.

Confirme que só escuta localmente (deve mostrar `127.0.0.1:5432`, nunca `0.0.0.0`):

```bash
sudo ss -tlnp | grep 5432
```

---

## 4. Criar a base de dados

Gere uma palavra-passe forte (hexadecimal evita caracteres que dão problemas no `.env`) e **guarde-a**:

```bash
openssl rand -hex 24
```

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE ashley LOGIN PASSWORD 'COLE_AQUI_A_PALAVRA_PASSE';
CREATE DATABASE ashley_portfolio OWNER ashley;
SQL
```

Não crie a base `ashley_portfolio_test` em produção (serve só para testes automáticos).

---

## 5. Colocar o código no servidor

```bash
sudo mkdir -p /var/www/portfolio
sudo chown deploy:deploy /var/www/portfolio
cd /var/www/portfolio
git clone git@github.com:SEU_UTILIZADOR/ashley-portfolio.git .
git config core.fileMode false     # as permissões ajustadas em storage/ não contam como alterações
```

(Repositório privado: crie uma *deploy key* com `ssh-keygen -t ed25519` no servidor e adicione a chave pública `~/.ssh/id_ed25519.pub` nas definições do repositório.)

---

## 6. Backend (Laravel)

### 6.1 Instalar dependências

```bash
cd /var/www/portfolio/backend
composer install --no-dev --optimize-autoloader --no-interaction
cp .env.example .env
```

### 6.2 Editar o `.env` de produção

```bash
nano .env
```

Altere/defina estas variáveis (o resto do `.env.example` pode ficar):

```dotenv
APP_NAME="Ashley Portfolio"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://SEU_IP

LOG_STACK=daily
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ashley_portfolio
DB_USERNAME=ashley
DB_PASSWORD=COLE_AQUI_A_PALAVRA_PASSE

SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
MEDIA_DISK=public

FRONTEND_URL=https://SEU_IP
SANCTUM_STATEFUL_DOMAINS=SEU_IP
```

Porque é que cada uma importa neste projecto:

| Variável | Atenção |
| --- | --- |
| `APP_DEBUG=false` | O `.env.example` vem com `true`; em produção mostraria erros internos |
| `APP_URL` | **É com ela que o Laravel gera os URLs das imagens e do CV** (`APP_URL/storage/...`). Tem de ser o endereço público exacto |
| `APP_ENV=production` | Necessário para o `robots.txt` permitir indexação; também desliga o modo estrito de desenvolvimento |
| `DB_PORT=5432` | O `.env.example` usa 5434 (porta do Docker de desenvolvimento) |
| `SESSION_SECURE_COOKIE=true` | Cookie só por HTTPS. **Se ficar sem HTTPS, tem de ser `false`** (ver secção 10) |
| `SANCTUM_STATEFUL_DOMAINS` | Só o IP, **sem** `https://` e sem porta (443 é a porta por omissão). Se estiver errado o login dá 419 |
| `FRONTEND_URL` | Usado no sitemap, no `robots.txt`, no redirect da raiz do backend e nos emails de recuperação |
| `MAIL_MAILER=log` | Mantém-se por agora; a recuperação de palavra-passe por email fica desactivada (ver 9) |

### 6.3 Inicializar a aplicação

```bash
php artisan key:generate
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
sudo chown deploy:www-data .env && sudo chmod 640 .env

sudo -u www-data php artisan migrate --force --seed
sudo -u www-data php artisan storage:link
sudo -u www-data php artisan admin:create
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
```

Notas:

- `key:generate` **uma só vez**. Mudar a `APP_KEY` depois invalida sessões e os `ip_hash` guardados. **Copie a `APP_KEY` para o seu gestor de palavras-passe.**
- `--seed` só na primeira instalação. Os projectos e serviços iniciais ficam em **rascunho**: publique-os no backoffice.
- `admin:create` pede nome, email e palavra-passe (mínimo 12 caracteres com maiúsculas, minúsculas, números e símbolos). Não há conta predefinida.
- Os comandos `artisan` correm como `www-data` para os ficheiros de log e cache pertencerem ao utilizador do PHP-FPM (evita erros de permissão).

---

## 7. Frontend (React)

### 7.1 Compilar no servidor

O frontend e a API ficam na mesma origem, por isso `VITE_API_URL` fica **vazio**.

```bash
cd /var/www/portfolio/frontend
cat > .env.production.local <<'EOF'
VITE_API_URL=
VITE_SITE_URL=https://SEU_IP
EOF
npm ci
npm run build          # gera frontend/dist
```

(`*.local` está no `frontend/.gitignore`, por isso este ficheiro não vai para o Git.)

### 7.2 Alternativa: compilar no PC e enviar

```powershell
cd frontend
$env:VITE_SITE_URL="https://SEU_IP"; npm run build
scp -r dist\* deploy@SEU_IP:/var/www/portfolio/frontend/dist/
```

(Crie antes a pasta: `mkdir -p /var/www/portfolio/frontend/dist` no servidor.)

---

## 8. Nginx

### 8.1 Passo A: configuração mínima em HTTP (só para obter o certificado)

```bash
sudo mkdir -p /var/www/certbot
sudo rm -f /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/sites-available/portfolio
```

```nginx
server {
    listen 80 default_server;
    server_name SEU_IP;

    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok\n"; add_header Content-Type text/plain; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t && sudo systemctl reload nginx
curl -i http://SEU_IP/        # deve responder 200 "ok"
```

Teste também **de fora do servidor** (do seu PC ou telemóvel com dados móveis) que `http://SEU_IP/` responde. Se não responder, o problema é firewall/router, e o certificado não será emitido.

---

## 9. HTTPS para o IP (Let's Encrypt)

O Let's Encrypt emite certificados para endereços IP desde 2026. São sempre de **perfil curto (~6 dias)**, por isso a renovação automática é obrigatória. Exige **Certbot 5.4 ou superior**; a versão do `apt` é antiga, use o `snap`:

```bash
sudo apt -y remove certbot 2>/dev/null
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
certbot --version          # tem de ser >= 5.4
```

### 9.1 Teste primeiro com o servidor de *staging* (não conta para limites)

```bash
sudo certbot certonly --staging \
  --preferred-profile shortlived \
  --webroot --webroot-path /var/www/certbot \
  --ip-address SEU_IP
```

### 9.2 Certificado real

```bash
sudo certbot certonly \
  --preferred-profile shortlived \
  --webroot --webroot-path /var/www/certbot \
  --ip-address SEU_IP \
  --cert-name SEU_IP --force-renewal
```

Os ficheiros ficam em `/etc/letsencrypt/live/SEU_IP/fullchain.pem` e `privkey.pem`.

### 9.3 Recarregar o Nginx a cada renovação

O Certbot ainda não instala certificados de IP no Nginx; é preciso um *deploy hook*:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

sudo certbot renew --dry-run          # simula a renovação
sudo systemctl list-timers | grep -i certbot    # tem de existir um temporizador activo
```

### 9.4 Configuração final do Nginx (HTTP → HTTPS + site)

```bash
sudo nano /etc/nginx/sites-available/portfolio
```

Substitua **todo** o conteúdo por:

```nginx
server {
    listen 80 default_server;
    server_name SEU_IP;

    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2 default_server;
    server_name SEU_IP;

    ssl_certificate     /etc/letsencrypt/live/SEU_IP/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/SEU_IP/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    server_tokens off;
    client_max_body_size 12m;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain application/xml;

    root /var/www/portfolio/frontend/dist;
    index index.html;

    # Esconder ficheiros ocultos (menos o desafio do Let's Encrypt)
    location ~ /\.(?!well-known) { deny all; }

    # SPA: qualquer rota pública cai no index.html (/projectos/..., /en/..., /admin/...)
    location / { try_files $uri /index.html; }

    # Ficheiros compilados do Vite (nomes com hash): cache longa
    location /assets/ { expires 1y; access_log off; try_files $uri =404; }

    # Laravel: API, Sanctum, sitemap, robots e health check
    location ~ ^/(api|sanctum)/ { try_files $uri @laravel; }
    location = /sitemap.xml { try_files $uri @laravel; }
    location = /robots.txt  { try_files $uri @laravel; }
    location = /up          { try_files $uri @laravel; }

    location @laravel {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/portfolio/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
    }

    # Imagens e CV carregados no backoffice: servidos como ficheiros estáticos, nunca executados
    location ^~ /storage/ {
        alias /var/www/portfolio/backend/storage/app/public/;
        try_files $uri =404;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Pontos que o projecto exige (já cobertos acima):

- `/sitemap.xml` e `/robots.txt` têm de ir para o Laravel; **não** coloque um `robots.txt` estático em `frontend/public`.
- O Nginx só serve `frontend/dist` e `backend/storage/app/public`; o código do Laravel nunca fica exposto.
- `client_max_body_size 12m` e os limites do PHP (3.2) têm de coincidir com os do backoffice.

### 9.5 Se (e só se) não conseguir HTTPS

Funciona em HTTP, mas a palavra-passe do backoffice viaja **em texto simples**. Use apenas temporariamente:

- `backend/.env`: `APP_URL=http://SEU_IP`, `FRONTEND_URL=http://SEU_IP`, **`SESSION_SECURE_COOKIE=false`**
- `frontend/.env.production.local`: `VITE_SITE_URL=http://SEU_IP` e recompilar
- No Nginx, um único `server` na porta 80 com o mesmo conteúdo do bloco 443 (sem as linhas `ssl_*` e sem HSTS)
- `sudo -u www-data php artisan config:cache`

---

## 10. Serviços opcionais e ajustes

### 10.1 Fila (só se configurar SMTP)

Com `MAIL_MAILER=log` não é preciso. Quando configurar SMTP no `.env`, a recuperação de palavra-passe passa a enviar email e precisa de um *worker*:

```bash
sudo tee /etc/systemd/system/portfolio-queue.service >/dev/null <<'EOF'
[Unit]
Description=Portfolio queue worker
After=network.target postgresql.service

[Service]
User=www-data
Restart=always
WorkingDirectory=/var/www/portfolio/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now portfolio-queue
```

Sem SMTP, uma palavra-passe esquecida repõe-se com `sudo -u www-data php artisan admin:create`.

### 10.2 Indexação em motores de busca

Com `APP_ENV=production` o `robots.txt` permite indexação (bloqueia só `/admin`). Enquanto o site estiver num IP, não o divulgue para pesquisa: o sitemap e os URLs canónicos usam o IP e terá de os mudar quando tiver domínio (secção 15).

---

## 11. Verificação (faça tudo antes de dar o site a alguém)

No servidor ou no seu PC:

```bash
curl -I  https://SEU_IP/up                    # 200
curl -s  https://SEU_IP/api/v1/site | head -c 300
curl -s  https://SEU_IP/robots.txt            # "Disallow: /admin" e Sitemap com https://SEU_IP
curl -s  https://SEU_IP/sitemap.xml | head
curl -I  http://SEU_IP/                       # 301 para https
curl -I  https://SEU_IP/projectos             # 200 (rota do SPA)
```

No navegador:

1. `https://SEU_IP` abre o site em português e `https://SEU_IP/en` em inglês; recarregar numa página interna não dá 404.
2. `https://SEU_IP/admin` → início de sessão com a conta criada. Se der **419**, reveja `SANCTUM_STATEFUL_DOMAINS` e `SESSION_SECURE_COOKIE`.
3. No backoffice: carregue uma fotografia (> 2 MB para testar o limite do PHP) e o CV em PDF. O URL da imagem tem de começar por `https://SEU_IP/storage/`.
4. Publique os projectos em rascunho que quiser mostrar e confirme que aparecem no site (há cache pública de até 60 s).
5. Cadeado do navegador sem avisos.

Segurança:

```bash
sudo ss -tlnp | grep -E '5432|php'     # PostgreSQL só em 127.0.0.1
sudo ufw status                         # só 22, 80, 443
curl -I https://SEU_IP/.env             # deve ser 404/403, nunca 200
curl -I https://SEU_IP/storage/../.env  # idem
```

---

## 12. Backups

Um backup no mesmo servidor não protege contra o servidor perder-se: copie também para fora (outro servidor, `rclone` para Google Drive, ou `scp` para o seu PC).

```bash
sudo tee /usr/local/bin/portfolio-backup.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
DEST=/var/backups/portfolio
STAMP=$(date +%F)
mkdir -p "$DEST"
sudo -u postgres pg_dump -Fc ashley_portfolio > "$DEST/db-$STAMP.dump"
tar -czf "$DEST/media-$STAMP.tar.gz" -C /var/www/portfolio/backend/storage/app public
find "$DEST" -type f -mtime +14 -delete
EOF
sudo chmod +x /usr/local/bin/portfolio-backup.sh
echo '30 2 * * * root /usr/local/bin/portfolio-backup.sh' | sudo tee /etc/cron.d/portfolio-backup
sudo /usr/local/bin/portfolio-backup.sh && ls -lh /var/backups/portfolio
```

Guarde também, fora do servidor e em local seguro, o `backend/.env` (contém a `APP_KEY` e a palavra-passe da base de dados).

**Repor um backup** (teste-o pelo menos uma vez):

```bash
sudo -u postgres pg_restore -c -d ashley_portfolio /var/backups/portfolio/db-AAAA-MM-DD.dump
sudo tar -xzf /var/backups/portfolio/media-AAAA-MM-DD.tar.gz -C /var/www/portfolio/backend/storage/app
sudo chown -R www-data:www-data /var/www/portfolio/backend/storage
```

---

## 13. Publicar novas versões

No PC: testes, `git push`. No servidor, crie o script de deploy uma vez:

```bash
cat > /var/www/portfolio/deploy.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/portfolio
git pull --ff-only

cd backend
composer install --no-dev --optimize-autoloader --no-interaction
sudo chown -R www-data:www-data storage bootstrap/cache
sudo -u www-data php artisan down --retry=30 || true
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan queue:restart
sudo -u www-data php artisan up

cd ../frontend
npm ci
npm run build

sudo systemctl reload php8.4-fpm
echo "Deploy concluído."
EOF
chmod +x /var/www/portfolio/deploy.sh
```

Em cada actualização:

```bash
sudo /usr/local/bin/portfolio-backup.sh      # backup antes
/var/www/portfolio/deploy.sh
```

**Se algo falhar:** `git log --oneline` → `git checkout <commit-anterior>` → repetir o deploy; se a versão nova trouxe migrations, `sudo -u www-data php artisan migrate:rollback --step=1 --force`; em último caso, repor o backup (secção 12). Erros ficam em `backend/storage/logs/laravel-AAAA-MM-DD.log`.

---

## 14. Manutenção regular

- `sudo unattended-upgrades --dry-run` (as actualizações de segurança automáticas já ficam activas com o pacote instalado).
- Mensalmente: `composer audit` e `npm audit`.
- **Certificado:** como dura ~6 dias, confirme uma vez após 3–4 dias que renovou sozinho: `sudo certbot certificates` (veja a data de expiração). Se não renovar, o site passa a mostrar aviso de segurança.
- `GET https://SEU_IP/up` serve para monitorização (por exemplo UptimeRobot, plano gratuito).
- Espaço em disco: `df -h`; logs diários em `storage/logs` (apague os antigos de tempos a tempos).

---

## 15. Quando tiver domínio

1. Compre o domínio e crie o registo **A** a apontar para `SEU_IP`; espere a propagação (`ping dominio`).
2. Emita o certificado normal (90 dias):
   ```bash
   sudo certbot certonly --webroot --webroot-path /var/www/certbot -d exemplo.co.mz -d www.exemplo.co.mz
   ```
3. No Nginx: `server_name exemplo.co.mz www.exemplo.co.mz;` e os caminhos `ssl_certificate` para `/etc/letsencrypt/live/exemplo.co.mz/`. Faça o bloco do IP redireccionar com 301 para o domínio.
4. `backend/.env`: `APP_URL`, `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` passam a ser o domínio (sem `https://` neste último). Depois: `sudo -u www-data php artisan config:cache`.
5. `frontend/.env.production.local`: `VITE_SITE_URL=https://exemplo.co.mz` e `npm run build`.
6. Reinicie sessão no backoffice (as sessões antigas deixam de valer). As imagens não precisam de alteração: o URL é calculado a partir de `APP_URL`.
7. Pare de renovar o certificado do IP: `sudo certbot delete --cert-name SEU_IP`.
8. Configure o email (SMTP) com um remetente `no-reply@exemplo.co.mz` e active a fila (10.1).

---

## 16. Resolução de problemas

| Sintoma | Causa provável e solução |
| --- | --- |
| Login dá **419** | `SANCTUM_STATEFUL_DOMAINS` não tem o IP, ou `SESSION_SECURE_COOKIE=true` com acesso por HTTP. Corrija e execute `config:cache` |
| Site abre mas fica em branco | `frontend/dist` não existe ou foi compilado com `VITE_API_URL` errado; recompile |
| Imagens dão 404 | Falta `php artisan storage:link` ou o bloco `location ^~ /storage/` do Nginx |
| Imagens com URL `http://localhost...` | `APP_URL` errado; corrija e `config:cache` |
| Upload falha com 413 | `client_max_body_size` no Nginx abaixo de 12m |
| Upload falha sem erro claro | `upload_max_filesize`/`post_max_size` do PHP (3.2); `systemctl restart php8.4-fpm` |
| **502 Bad Gateway** | PHP-FPM parado ou socket diferente: `systemctl status php8.4-fpm` e `ls /run/php/` |
| **500** em `/api/...` | Veja `backend/storage/logs/laravel-*.log`; normalmente permissões de `storage/` ou `.env` mal preenchido |
| `Permission denied` em `storage/logs` | Corra o `artisan` sempre com `sudo -u www-data` e repita `chown -R www-data:www-data storage bootstrap/cache` |
| Mudei o `.env` e nada acontece | Falta `sudo -u www-data php artisan config:cache` |
| `/robots.txt` mostra `Disallow: /` | `APP_ENV` não é `production` |
| Aviso de certificado ao fim de uns dias | Renovação falhou: `sudo certbot renew`, `journalctl -u snap.certbot.renew` e confirme que a porta 80 está acessível |
| `certbot: unrecognized arguments: --ip-address` | Versão do Certbot < 5.3; instale-o por `snap` (secção 9) |

---

## 17. Lista final (marque antes de anunciar o site)

- [ ] Testes do backend e do frontend passam; nenhum `.env` está no Git
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://SEU_IP`
- [ ] PostgreSQL só em `127.0.0.1`; `ufw` só com 22, 80 e 443
- [ ] Login por SSH só com chave; utilizador `root` desactivado
- [ ] HTTPS com cadeado; HTTP redirecciona; renovação automática testada
- [ ] Conta de administrador criada com palavra-passe forte; login funciona
- [ ] Upload de imagem e CV testados; projectos publicados
- [ ] `robots.txt` e `sitemap.xml` respondem pelo Laravel
- [ ] Backup diário a correr, com cópia **fora** do servidor, e reposição testada
- [ ] `APP_KEY` e palavra-passe da base de dados guardadas num gestor de palavras-passe
- [ ] Monitorização de `/up` configurada

---

### Fontes

- [Let's Encrypt: certificados de 6 dias e de endereço IP disponíveis para todos](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability.html)
- [Let's Encrypt/EFF: certificados de 6 dias e IP no Certbot (comando e requisitos de versão)](https://letsencrypt.org/2026/03/11/shorter-certs-certbot.html)
