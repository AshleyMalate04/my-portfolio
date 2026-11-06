<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;

class EducationRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'institution' => [$this->presence(), 'string', 'max:255'],
            'institution_short_name' => ['nullable', 'string', 'max:50'],
            ...Translatable::text('degree', $this->presence() === 'required' ? 'required' : 'sometimes', 255),
            ...Translatable::text('field', 'nullable', 255),
            ...Translatable::text('specialization', 'nullable', 255),
            ...Translatable::text('description', 'nullable', 2000),
            'location' => ['nullable', 'string', 'max:255'],
            'started_at' => $this->dateRules(),
            'ended_at' => [...$this->dateRules(), 'after_or_equal:started_at'],
            'is_current' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
