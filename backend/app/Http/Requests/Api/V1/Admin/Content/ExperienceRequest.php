<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Enums\EmploymentType;
use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;
use Illuminate\Validation\Rule;

class ExperienceRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'organization' => [$this->presence(), 'string', 'max:255'],
            ...Translatable::text('role', $this->presence() === 'required' ? 'required' : 'sometimes', 255),
            'employment_type' => [$this->presence(), Rule::enum(EmploymentType::class)],
            ...Translatable::text('description', 'nullable', 2000),
            'location' => ['nullable', 'string', 'max:255'],
            'started_at' => $this->dateRules(),
            'ended_at' => [...$this->dateRules(), 'after_or_equal:started_at'],
            'is_current' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
