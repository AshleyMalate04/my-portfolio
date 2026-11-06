<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Certification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Certification */
class CertificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind->value,
            'name' => $this->translate('name'),
            'issuer' => $this->issuer,
            'description' => $this->translate('description'),
            'issued_at' => $this->issued_at?->toDateString(),
            'expires_at' => $this->expires_at?->toDateString(),
            'credential_url' => $this->credential_url,
            'document_url' => $this->whenLoaded('document', fn () => $this->document?->url),
        ];
    }
}
