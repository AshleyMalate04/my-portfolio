<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProfileResource;
use App\Models\Profile;

class ProfileController extends Controller
{
    public function show(): ProfileResource
    {
        $profile = Profile::current();

        abort_if($profile === null, 404);

        return ProfileResource::make($profile);
    }
}
