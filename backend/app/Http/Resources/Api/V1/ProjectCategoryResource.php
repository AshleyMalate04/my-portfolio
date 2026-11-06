<?php

namespace App\Http\Resources\Api\V1;

use App\Models\ProjectCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProjectCategory */
class ProjectCategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->translate('name'),
            'projects_count' => $this->whenCounted('projects'),
        ];
    }
}
