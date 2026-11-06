<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;

class SkillRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'skill_category_id' => [$this->presence(), 'integer', 'exists:skill_categories,id'],
            'technology_id' => ['nullable', 'integer', 'exists:technologies,id'],
            ...Translatable::text('name', $this->presence() === 'required' ? 'required' : 'sometimes', 100),
            ...Translatable::text('description', 'nullable', 500),
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
