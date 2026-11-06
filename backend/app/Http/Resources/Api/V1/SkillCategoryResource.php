<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SkillCategory */
class SkillCategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->translate('name'),
            'description' => $this->translate('description'),
            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn (Skill $skill) => [
                'name' => $skill->translate('name'),
                'description' => $skill->translate('description'),
                'technology' => $skill->technology ? TechnologyResource::make($skill->technology) : null,
            ])),
        ];
    }
}
