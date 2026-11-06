<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;

class SkillCategoryRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'slug' => $this->slugRules('skill_categories'),
            ...Translatable::text('name', $this->presence() === 'required' ? 'required' : 'sometimes', 100),
            ...Translatable::text('description', 'nullable', 500),
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
