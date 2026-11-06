<?php

use App\Http\Controllers\SeoController;
use App\Http\Middleware\SetContentLocale;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Fora do grupo "web": respostas sem sessão nem cookies, adequadas a cache.
        then: function () {
            Route::get('sitemap.xml', [SeoController::class, 'sitemap'])->name('sitemap');
            Route::get('robots.txt', [SeoController::class, 'robots'])->name('robots');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Autenticação de SPA por sessão/cookie (Sanctum) para pedidos vindos do frontend autorizado.
        $middleware->statefulApi();
        $middleware->api(prepend: [SetContentLocale::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Respostas de erro da API com formato consistente {"message": "..."} e sem detalhes internos.
        $isApi = fn (Request $request): bool => $request->is('api/*');

        $exceptions->render(function (NotFoundHttpException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => __('api.not_found')], 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => __('api.method_not_allowed')], 405);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => __('api.unauthenticated')], 401);
            }
        });

        $exceptions->render(function (AuthorizationException|AccessDeniedHttpException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => __('api.forbidden')], 403);
            }
        });

        // Sessão expirada ou cookie CSRF em falta (o Laravel converte-o num HttpException 419): o frontend pede um novo cookie e repete o pedido.
        $exceptions->render(function (HttpException $e, Request $request) use ($isApi) {
            if ($e->getStatusCode() === 419 && $isApi($request)) {
                return response()->json(['message' => __('api.csrf_mismatch')], 419);
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => __('api.too_many_requests')], 429, $e->getHeaders());
            }
        });

        // Nunca registar estes campos nos logs ou na sessão de validação.
        $exceptions->dontFlash(['password', 'password_confirmation', 'current_password']);
    })->create();
