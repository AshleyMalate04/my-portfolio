<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CertificationResource;
use App\Http\Resources\Api\V1\EducationResource;
use App\Http\Resources\Api\V1\ExperienceResource;
use App\Http\Resources\Api\V1\ProcessStepResource;
use App\Http\Resources\Api\V1\ProjectCategoryResource;
use App\Http\Resources\Api\V1\ServiceResource;
use App\Http\Resources\Api\V1\SkillCategoryResource;
use App\Http\Resources\Api\V1\SocialLinkResource;
use App\Http\Resources\Api\V1\TechnologyResource;
use App\Http\Resources\Api\V1\TestimonialResource;
use App\Queries\PublicContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Listagens públicas de leitura simples: devolvem apenas conteúdo publicado, pela ordem definida no backoffice.
 */
class CatalogueController extends Controller
{
    public function __construct(private readonly PublicContent $content) {}

    public function projectCategories(): AnonymousResourceCollection
    {
        return ProjectCategoryResource::collection($this->content->projectCategories());
    }

    public function skills(): AnonymousResourceCollection
    {
        return SkillCategoryResource::collection($this->content->skills());
    }

    public function technologies(): AnonymousResourceCollection
    {
        return TechnologyResource::collection($this->content->technologies());
    }

    public function journey(): JsonResponse
    {
        return response()->json(['data' => self::journeyResources($this->content->journey())]);
    }

    public function services(): AnonymousResourceCollection
    {
        return ServiceResource::collection($this->content->services());
    }

    public function processSteps(): AnonymousResourceCollection
    {
        return ProcessStepResource::collection($this->content->processSteps());
    }

    public function testimonials(): AnonymousResourceCollection
    {
        return TestimonialResource::collection($this->content->testimonials());
    }

    public function socialLinks(): AnonymousResourceCollection
    {
        return SocialLinkResource::collection($this->content->socialLinks());
    }

    /**
     * @param  array{education: mixed, experience: mixed, certifications: mixed}  $journey
     * @return array<string, AnonymousResourceCollection>
     */
    public static function journeyResources(array $journey): array
    {
        return [
            'education' => EducationResource::collection($journey['education']),
            'experience' => ExperienceResource::collection($journey['experience']),
            'certifications' => CertificationResource::collection($journey['certifications']),
        ];
    }
}
