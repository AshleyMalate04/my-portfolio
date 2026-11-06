# Backend — ASHLEY PORTFOLIO

API Laravel 13 do portfólio. Instalação, comandos e decisões: ver o [README da raiz](../README.md), [docs/api.md](../docs/api.md) e [docs/architecture.md](../docs/architecture.md).

Estrutura principal:

- `app/Http/Controllers/Api/V1` — controladores públicos e `Admin/`
- `app/Http/Requests`, `app/Http/Resources/Api/V1` — validação e formato das respostas
- `app/Models` (+ `Concerns/HasTranslations`, `Concerns/Publishable`), `app/Enums`
- `app/Services` — contacto, multimédia, registo de actividade
- `app/Console/Commands/CreateAdminCommand.php` — `php artisan admin:create`
- `config/portfolio.php` — idiomas, limites de upload, contacto
- `database/seeders` — conteúdo inicial seguro (sem credenciais)
