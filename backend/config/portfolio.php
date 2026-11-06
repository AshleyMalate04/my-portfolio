<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Idiomas do conteúdo
    |--------------------------------------------------------------------------
    |
    | Os campos de texto traduzíveis são guardados em JSONB, por exemplo
    | {"pt": "Projecto", "en": "Project"}. O português é o idioma principal e
    | serve de recurso quando a tradução pedida ainda não existe.
    |
    */

    'locales' => ['pt', 'en'],

    'default_locale' => 'pt',

    // Códigos hreflang (iguais aos usados pelo frontend em src/i18n/locales.ts).
    'hreflang' => ['pt' => 'pt-MZ', 'en' => 'en'],

    /*
    |--------------------------------------------------------------------------
    | Multimédia
    |--------------------------------------------------------------------------
    |
    | O disco "public" guarda ficheiros servidos publicamente (imagens e CV).
    | Os tipos permitidos são validados pelo conteúdo do ficheiro (MIME real)
    | e não apenas pela extensão. SVG fica excluído por poder conter scripts.
    |
    */

    'media' => [
        'disk' => env('MEDIA_DISK', 'public'),
        'directory' => 'media',
        'max_image_kb' => (int) env('MEDIA_MAX_IMAGE_KB', 5120),
        'max_document_kb' => (int) env('MEDIA_MAX_DOCUMENT_KB', 10240),
        'image_mimes' => ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        'document_mimes' => ['application/pdf'],
    ],

    /*
    | Recuperação de palavra-passe por email: só activa quando há um transporte real configurado
    | (os mailers "log" e "array" não entregam emails).
    */
    'password_reset_enabled' => ! in_array(env('MAIL_MAILER', 'log'), ['log', 'array'], true),

    // Primeira origem de FRONTEND_URL (a variável pode listar várias origens para CORS).

    'frontend_url' => trim(explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173'))[0]),

    /*
    |--------------------------------------------------------------------------
    | Caminhos públicos do frontend
    |--------------------------------------------------------------------------
    |
    | Usados no sitemap. Têm de coincidir com as rotas em frontend/src/routes/paths.ts.
    |
    */

    'public_paths' => [
        'pt' => ['home' => '/', 'projects' => '/projectos', 'project' => '/projectos/{slug}'],
        'en' => ['home' => '/en', 'projects' => '/en/projects', 'project' => '/en/projects/{slug}'],
    ],

];
