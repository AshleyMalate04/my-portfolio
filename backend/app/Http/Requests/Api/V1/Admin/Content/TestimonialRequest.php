<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Enums\MediaKind;
use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Models\Testimonial;
use App\Rules\MediaOfKind;
use App\Support\Translatable;
use Illuminate\Validation\Validator;

class TestimonialRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'author_name' => [$this->presence(), 'string', 'max:255'],
            ...Translatable::text('author_role', 'nullable', 150),
            'author_organization' => ['nullable', 'string', 'max:255'],
            ...Translatable::text('quote', $this->presence() === 'required' ? 'required' : 'sometimes', 2000),
            'author_media_id' => ['nullable', new MediaOfKind(MediaKind::Image)],
            'consent_confirmed' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }

    /** Publicar exige autorização confirmada (considerando o valor já gravado em edições parciais). */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $current = $this->recordId() ? Testimonial::query()->find($this->recordId()) : null;
                $published = $this->has('is_published') ? $this->boolean('is_published') : (bool) $current?->is_published;
                $consent = $this->has('consent_confirmed') ? $this->boolean('consent_confirmed') : (bool) $current?->consent_confirmed;

                if ($published && ! $consent) {
                    $validator->errors()->add('is_published', __('admin.testimonial_requires_consent'));
                }
            },
        ];
    }
}
