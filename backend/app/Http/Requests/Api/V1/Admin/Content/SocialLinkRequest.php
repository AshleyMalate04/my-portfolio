<?php

namespace App\Http\Requests\Api\V1\Admin\Content;

use App\Enums\SocialPlatform;
use App\Http\Requests\Api\V1\Admin\AdminFormRequest;
use App\Models\SocialLink;
use Closure;
use Illuminate\Validation\Rule;

class SocialLinkRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'platform' => [$this->presence(), Rule::enum(SocialPlatform::class)],
            'label' => ['nullable', 'string', 'max:100'],
            'url' => [$this->presence(), 'string', 'max:2048', $this->urlRule()],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Email aceita "mailto:endereço"; as restantes plataformas apenas http/https.
     * Esquemas como javascript: ou data: são sempre rejeitados.
     */
    private function urlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $platform = $this->input('platform')
                ?? ($this->recordId() ? SocialLink::query()->find($this->recordId())?->platform?->value : null);

            if ($platform === SocialPlatform::Email->value) {
                if (! is_string($value) || ! preg_match('/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/', $value)) {
                    $fail('Para email use o formato mailto:nome@dominio.');
                }

                return;
            }

            if (! is_string($value) || ! preg_match('#^https?://#i', $value) || filter_var($value, FILTER_VALIDATE_URL) === false) {
                $fail(__('validation.url', ['attribute' => 'URL']));
            }
        };
    }
}
