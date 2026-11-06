<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Profile */
class ProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'full_name' => $this->full_name,
            'display_name' => $this->display_name ?? $this->full_name,
            'headline' => $this->translate('headline'),
            'short_bio' => $this->translate('short_bio'),
            'long_bio' => $this->translate('long_bio'),
            'hero_phrases' => $this->translate('hero_phrases') ?? [],
            'interests' => $this->translate('interests') ?? [],
            'approach' => $this->translate('approach'),
            'goals' => $this->translate('goals'),
            'location' => $this->location,
            'public_email' => $this->public_email,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            // A disponibilidade só é revelada quando foi explicitamente activada no backoffice.
            'availability' => $this->when($this->show_availability && $this->availability_status !== null, fn () => [
                'status' => $this->availability_status->value,
                'note' => $this->translate('availability_note'),
            ]),
            'photo' => MediaResource::make($this->whenLoaded('photo')),
            'hero_image' => MediaResource::make($this->whenLoaded('heroImage')),
            'cv_url' => $this->whenLoaded('cv', fn () => $this->cv?->url),
        ];
    }
}
