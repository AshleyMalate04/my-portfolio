<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Experience;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Experience */
class ExperienceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization' => $this->organization,
            'role' => $this->translate('role'),
            'employment_type' => $this->employment_type->value,
            'description' => $this->translate('description'),
            'location' => $this->location,
            'started_at' => $this->started_at?->toDateString(),
            'ended_at' => $this->ended_at?->toDateString(),
            'is_current' => $this->is_current,
        ];
    }
}
