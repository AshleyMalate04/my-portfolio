<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ProfileRequest;
use App\Http\Resources\Api\V1\Admin\AdminRecordResource;
use App\Models\Profile;
use App\Services\ActivityLogger;
use App\Support\Translatable;
use Illuminate\Http\JsonResponse;

/** Perfil profissional (registo único): leitura e edição com traduções completas. */
class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $profile = Profile::query()->with(['photo', 'heroImage', 'cv'])->oldest('id')->first();

        return response()->json(['data' => $profile ? AdminRecordResource::make($profile) : null]);
    }

    public function update(ProfileRequest $request, ActivityLogger $activity): JsonResponse
    {
        $data = $request->validated();

        foreach ((new Profile)->getTranslatableAttributes() as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = Translatable::clean($data[$field]);
            }
        }

        $profile = Profile::query()->oldest('id')->first() ?? new Profile;
        $profile->fill($data)->save();
        $activity->log('profile.updated', $profile, ['fields' => array_keys($data)]);

        return AdminRecordResource::make($profile->fresh(['photo', 'heroImage', 'cv']))
            ->additional(['message' => __('admin.updated')])
            ->response();
    }
}
