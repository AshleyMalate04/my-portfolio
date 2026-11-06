<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Support\Translatable;

class ServiceRequest extends AdminFormRequest
{
    /** Ícones suportados pelo frontend (src/components/ui/ServiceIcon.tsx). */
    public const ICONS = [
        'clipboard-list', 'code-xml', 'database', 'globe', 'layout-dashboard',
        'layout-template', 'plug', 'server', 'smartphone', 'wrench',
    ];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'slug' => $this->slugRules('services'),
            ...Translatable::text('title', $this->presence() === 'required' ? 'required' : 'sometimes', 150),
            ...Translatable::text('summary', 'nullable', 500),
            ...Translatable::text('description', 'nullable', 3000),
            'icon' => ['nullable', 'string', 'in:'.implode(',', self::ICONS)],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
