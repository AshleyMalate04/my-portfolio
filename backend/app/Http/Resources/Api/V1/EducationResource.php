<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Education;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Education */
class EducationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'institution' => $this->institution,
            'institution_short_name' => $this->institution_short_name,
            'degree' => $this->translate('degree'),
            'field' => $this->translate('field'),
            'specialization' => $this->translate('specialization'),
            'description' => $this->translate('description'),
            'location' => $this->location,
            'started_at' => $this->started_at?->toDateString(),
            'ended_at' => $this->ended_at?->toDateString(),
            'is_current' => $this->is_current,
        ];
    }
}
