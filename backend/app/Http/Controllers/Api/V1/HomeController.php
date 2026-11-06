<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProcessStepResource;
use App\Http\Resources\Api\V1\ProfileResource;
use App\Http\Resources\Api\V1\ProjectCategoryResource;
use App\Http\Resources\Api\V1\ProjectSummaryResource;
use App\Http\Resources\Api\V1\ServiceResource;
use App\Http\Resources\Api\V1\SkillCategoryResource;
use App\Http\Resources\Api\V1\SocialLinkResource;
use App\Http\Resources\Api\V1\TestimonialResource;
use App\Models\Profile;
use App\Queries\PublicContent;
use Illuminate\Http\JsonResponse;

/**
 * Todo o conteúdo da página inicial num único pedido (menos latência e uma só entrada de cache).
 * Os endpoints individuais continuam disponíveis para as restantes páginas e integrações.
 */
class HomeController extends Controller
{
    /** Número de projectos apresentados na página inicial; os restantes ficam na página de projectos. */
    private const HOME_PROJECTS = 6;

    public function show(PublicContent $content): JsonResponse
    {
        $profile = Profile::current();
        $projects = $content->projects()->limit(self::HOME_PROJECTS)->get();

        return response()->json([
            'data' => [
                'locale' => app()->getLocale(),
                'available_locales' => config('portfolio.locales'),
                'settings' => (object) $content->settings(),
                'profile' => $profile ? ProfileResource::make($profile) : null,
                'projects' => [
                    'items' => ProjectSummaryResource::collection($projects),
                    'total' => $content->projects()->toBase()->getCountForPagination(),
                ],
                'project_categories' => ProjectCategoryResource::collection($content->projectCategories()),
                'skills' => SkillCategoryResource::collection($content->skills()),
                'journey' => CatalogueController::journeyResources($content->journey()),
                'services' => ServiceResource::collection($content->services()),
                'process_steps' => ProcessStepResource::collection($content->processSteps()),
                'testimonials' => TestimonialResource::collection($content->testimonials()),
                'social_links' => SocialLinkResource::collection($content->socialLinks()),
            ],
        ]);
    }
}
