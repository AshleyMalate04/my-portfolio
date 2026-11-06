<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\SettingsRequest;
use App\Models\Media;
use App\Models\SiteSetting;
use App\Services\ActivityLogger;
use App\Support\Translatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Definições gerais do site (chave/valor), com as traduções completas para edição. */
class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->payload()]);
    }

    public function update(SettingsRequest $request, ActivityLogger $activity): JsonResponse
    {
        $data = collect($request->validated())->only(SettingsRequest::settingKeys());

        DB::transaction(function () use ($data) {
            foreach ($data as $key => $value) {
                if ($key === 'sections') {
                    // Junta com o valor actual para que alterar uma secção não apague as outras.
                    $current = SiteSetting::query()->where('key', 'sections')->value('value') ?? [];
                    $value = array_map('boolval', [...$current, ...$value]);
                } elseif (is_array($value)) {
                    $value = Translatable::clean($value);
                } elseif (Str::endsWith($key, '_media_id') && $value !== null) {
                    $value = (int) $value;
                }

                SiteSetting::query()->updateOrCreate(['key' => $key], ['value' => $value, 'is_public' => true]);
            }
        });

        $activity->log('settings.updated', null, ['keys' => $data->keys()->all()]);

        return response()->json(['data' => $this->payload(), 'message' => __('admin.updated')]);
    }

    /** @return array{values: object, media: array<string, Media|null>} */
    private function payload(): array
    {
        $values = SiteSetting::query()->orderBy('key')->pluck('value', 'key');
        $mediaIds = $values->filter(fn ($value, $key) => Str::endsWith($key, '_media_id') && is_int($value));
        $media = Media::query()->whereIn('id', $mediaIds->values())->get()->keyBy('id');

        return [
            'values' => (object) $values->all(),
            // Ficheiros referenciados, para mostrar pré-visualizações no formulário.
            'media' => $mediaIds->map(fn (int $id) => $media->get($id))->all(),
        ];
    }
}
