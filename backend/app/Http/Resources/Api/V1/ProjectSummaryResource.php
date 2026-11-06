<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representação compacta para listagens e cartões de projectos.
 *
 * @mixin Project
 */
class ProjectSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->translate('title'),
            'summary' => $this->translate('summary'),
            'project_status' => $this->project_status?->value,
            'is_featured' => $this->is_featured,
            'started_at' => $this->started_at?->toDateString(),
            'ended_at' => $this->ended_at?->toDateString(),
            'category' => ProjectCategoryResource::make($this->whenLoaded('category')),
            'cover' => MediaResource::make($this->whenLoaded('cover')),
            'technologies' => TechnologyResource::collection($this->whenLoaded('technologies')),
            'demo_url' => $this->demo_url,
            'repository_url' => $this->repository_url,
        ];
    }
}
