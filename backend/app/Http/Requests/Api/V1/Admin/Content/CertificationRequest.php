<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Enums\CertificationKind;
use App\Enums\MediaKind;
use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Rules\MediaOfKind;
use App\Support\Translatable;
use Illuminate\Validation\Rule;

class CertificationRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'kind' => [$this->presence(), Rule::enum(CertificationKind::class)],
            ...Translatable::text('name', $this->presence() === 'required' ? 'required' : 'sometimes', 255),
            'issuer' => [$this->presence(), 'string', 'max:255'],
            ...Translatable::text('description', 'nullable', 2000),
            'issued_at' => $this->dateRules(),
            'expires_at' => [...$this->dateRules(), 'after_or_equal:issued_at'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'credential_url' => $this->urlRules(),
            'document_media_id' => ['nullable', new MediaOfKind(MediaKind::Document)],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
