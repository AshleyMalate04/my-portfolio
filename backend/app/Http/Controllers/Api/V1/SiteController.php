<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Queries\PublicContent;
use Illuminate\Http\JsonResponse;

/**
 * Definições públicas do site (nome, SEO, visibilidade das secções...) no idioma pedido.
 */
class SiteController extends Controller
{
    public function show(PublicContent $content): JsonResponse
    {
        return response()->json([
            'data' => [
                'locale' => app()->getLocale(),
                'available_locales' => config('portfolio.locales'),
                'settings' => (object) $content->settings(),
            ],
        ]);
    }
}
