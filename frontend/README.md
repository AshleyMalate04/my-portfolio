# Frontend — ASHLEY PORTFOLIO

React 19 + TypeScript 7 + Vite 8 + Tailwind CSS 4. Instalação e comandos: ver o [README da raiz](../README.md).

- `src/lib/api/` — cliente HTTP único (CSRF, idioma, erros), endpoints e tipos
- `src/i18n/` — idiomas (pt na raiz, en em `/en`) e textos da interface
- `src/styles/index.css` — tokens de design (cores, tipografia, raios, movimento)
- `src/layouts/`, `src/pages/`, `src/features/admin/` — estrutura pública e do backoffice
- `src/app/` — router, React Query e composição da aplicação
