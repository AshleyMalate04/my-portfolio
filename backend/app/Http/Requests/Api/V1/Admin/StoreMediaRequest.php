<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $media = config('portfolio.media');
        $mimes = [...$media['image_mimes'], ...$media['document_mimes']];

        return [
            'file' => [
                'required',
                'file',
                // mimetypes valida o tipo real detectado a partir do conteúdo do ficheiro.
                'mimetypes:'.implode(',', $mimes),
                'max:'.max($media['max_image_kb'], $media['max_document_kb']),
            ],
            'alt' => ['nullable', 'array:'.implode(',', config('portfolio.locales'))],
            'alt.*' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $file = $this->file('file');

                if ($validator->errors()->has('file') || $file === null) {
                    return;
                }

                $media = config('portfolio.media');

                if (in_array($file->getMimeType(), $media['image_mimes'], true)) {
                    if ($file->getSize() > $media['max_image_kb'] * 1024) {
                        $validator->errors()->add('file', __('validation.max.file', ['attribute' => 'ficheiro', 'max' => $media['max_image_kb']]));

                        return;
                    }

                    $size = @getimagesize($file->getRealPath());

                    // Rejeita imagens corrompidas ou com dimensões exageradas (protecção contra "decompression bombs").
                    if ($size === false || $size[0] > 10000 || $size[1] > 10000) {
                        $validator->errors()->add('file', __('validation.image', ['attribute' => 'ficheiro']));
                    }
                }
            },
        ];
    }
}
