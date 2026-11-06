<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Project;
use App\Models\ProjectImage;
use Illuminate\Http\Request;

/**
 * Detalhe público de um projecto.
 *
 * @mixin Project
 */
class ProjectResource extends ProjectSummaryResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'description' => $this->translate('description'),
            'problem' => $this->translate('problem'),
            'objective' => $this->translate('objective'),
            'solution' => $this->translate('solution'),
            'contribution' => $this->translate('contribution'),
            'challenges' => $this->translate('challenges'),
            'features' => $this->translate('features') ?? [],
            'results' => $this->translate('results'),
            'gallery' => $this->whenLoaded('images', fn () => $this->images->map(fn (ProjectImage $image) => [
                'caption' => $image->translate('caption'),
                'media' => MediaResource::make($image->media),
            ])),
            'seo' => [
                'title' => $this->translate('seo_title') ?? $this->translate('title'),
                'description' => $this->translate('seo_description') ?? $this->translate('summary'),
            ],
            'published_at' => $this->published_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
