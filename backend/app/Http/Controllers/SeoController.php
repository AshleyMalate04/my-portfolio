<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Response;

/**
 * sitemap.xml e robots.txt gerados a partir do conteúdo publicado, com URLs do frontend
 * (FRONTEND_URL). Em produção, o servidor web deve encaminhar estes dois caminhos para o Laravel.
 */
class SeoController extends Controller
{
    public function sitemap(): Response
    {
        $base = rtrim((string) config('portfolio.frontend_url'), '/');
        $paths = config('portfolio.public_paths');
        $locales = config('portfolio.locales');
        $urls = [];

        // Páginas fixas: início e lista de projectos, em cada idioma.
        foreach (['home', 'projects'] as $page) {
            $urls[] = ['alternates' => collect($locales)->mapWithKeys(fn ($locale) => [$locale => $base.$paths[$locale][$page]])->all(), 'lastmod' => null];
        }

        Project::query()->published()->orderBy('id')->get(['slug', 'updated_at'])->each(function (Project $project) use (&$urls, $base, $paths, $locales) {
            $urls[] = [
                'alternates' => collect($locales)->mapWithKeys(fn ($locale) => [
                    $locale => $base.str_replace('{slug}', rawurlencode($project->slug), $paths[$locale]['project']),
                ])->all(),
                'lastmod' => $project->updated_at?->toDateString(),
            ];
        });

        $xml = view('seo.sitemap', ['urls' => $urls, 'locales' => $locales])->render();

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function robots(): Response
    {
        $base = rtrim((string) config('portfolio.frontend_url'), '/');
        $lines = ['User-agent: *'];

        // Fora de produção nada deve ser indexado (ambientes de teste/staging).
        $lines[] = app()->isProduction() ? 'Disallow: /admin' : 'Disallow: /';
        $lines[] = '';
        $lines[] = "Sitemap: {$base}/sitemap.xml";

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
