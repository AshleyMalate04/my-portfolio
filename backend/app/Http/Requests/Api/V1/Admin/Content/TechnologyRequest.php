<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Http\Requests\Api\V1\Admin\AdminFormRequest;

class TechnologyRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $ignore = $this->recordId() ? ','.$this->recordId() : '';

        return [
            'name' => [$this->presence(), 'string', 'max:100', 'unique:technologies,name'.$ignore],
            'slug' => $this->slugRules('technologies'),
            'website_url' => $this->urlRules(),
        ];
    }
}
