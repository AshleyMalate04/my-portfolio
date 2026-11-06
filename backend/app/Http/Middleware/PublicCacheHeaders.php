<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permite que navegadores e proxies guardem por pouco tempo as leituras públicas.
 * Só se aplica a respostas GET bem-sucedidas sem cookies (pedidos sem sessão), para nunca
 * partilhar em cache uma resposta associada a um visitante.
 */
class PublicCacheHeaders
{
    public function handle(Request $request, Closure $next, int $maxAge = 60): Response
    {
        $response = $next($request);

        if ($request->isMethodCacheable() && $response->isSuccessful() && $response->headers->getCookies() === []) {
            $response->headers->set('Cache-Control', "public, max-age={$maxAge}, stale-while-revalidate=300");
        }

        return $response;
    }
}
