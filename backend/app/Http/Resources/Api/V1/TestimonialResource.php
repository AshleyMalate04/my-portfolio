<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Testimonial */
class TestimonialResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'author_role' => $this->translate('author_role'),
            'author_organization' => $this->author_organization,
            'quote' => $this->translate('quote'),
            'author_photo' => MediaResource::make($this->whenLoaded('authorPhoto')),
        ];
    }
}
