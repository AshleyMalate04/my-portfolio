<?php

namespace App\Http\Resources\Api\V1;

use App\Models\SocialLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SocialLink */
class SocialLinkResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'platform' => $this->platform->value,
            'label' => $this->label,
            'url' => $this->url,
        ];
    }
}
