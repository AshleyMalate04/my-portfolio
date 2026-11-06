<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;

class ProcessStepRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            ...Translatable::text('title', $this->presence() === 'required' ? 'required' : 'sometimes', 150),
            ...Translatable::text('description', 'nullable', 1000),
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
