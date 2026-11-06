<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Define o idioma dos conteúdos e mensagens da API a partir do parâmetro ?lang=.
 *
 * O cabeçalho Accept-Language é ignorado de propósito: o idioma é escolhido pelo frontend
 * (pelo URL, ex.: /en/...), o que mantém as respostas determinísticas, indexáveis e fáceis de cachear.
 */
class SetContentLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $requested = $request->query('lang');

        $locale = is_string($requested) && in_array($requested, config('portfolio.locales'), true)
            ? $requested
            : config('portfolio.default_locale');

        app()->setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        return $response;
    }
}
