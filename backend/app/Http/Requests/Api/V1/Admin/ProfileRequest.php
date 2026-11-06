<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\AvailabilityStatus;
use App\Enums\MediaKind;
use App\Models\Profile;
use App\Rules\MediaOfKind;
use App\Support\Translatable;
use Illuminate\Validation\Rule;

class ProfileRequest extends AdminFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        // O nome só é obrigatório se o perfil ainda não existir.
        $presence = Profile::query()->exists() ? 'sometimes' : 'required';
        $phone = ['nullable', 'string', 'max:40', 'regex:/^\+?[0-9 ()-]{6,40}$/'];

        return [
            'full_name' => [$presence, 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            ...Translatable::text('headline', 'nullable', 160),
            ...Translatable::text('short_bio', 'nullable', 600),
            ...Translatable::text('long_bio', 'nullable', 6000),
            ...Translatable::list('hero_phrases', 5, 200),
            ...Translatable::list('interests', 20, 120),
            ...Translatable::text('approach', 'nullable', 2000),
            ...Translatable::text('goals', 'nullable', 2000),
            'location' => ['nullable', 'string', 'max:255'],
            'public_email' => ['nullable', 'string', 'email', 'max:254'],
            'phone' => $phone,
            'whatsapp' => $phone,
            'availability_status' => ['nullable', Rule::enum(AvailabilityStatus::class)],
            ...Translatable::text('availability_note', 'nullable', 150),
            'show_availability' => ['sometimes', 'boolean'],
            'photo_media_id' => ['nullable', new MediaOfKind(MediaKind::Image)],
            'hero_media_id' => ['nullable', new MediaOfKind(MediaKind::Image)],
            'cv_media_id' => ['nullable', new MediaOfKind(MediaKind::Document)],
        ];
    }
}
