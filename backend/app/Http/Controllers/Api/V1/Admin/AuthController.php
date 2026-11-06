<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\LoginRequest;
use App\Http\Resources\Api\V1\AdminUserResource;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Autenticação do backoffice por sessão (Sanctum SPA): cookie HttpOnly + protecção CSRF.
 * Não há registo público; as contas são criadas com "php artisan admin:create".
 */
class AuthController extends Controller
{
    public function login(LoginRequest $request, ActivityLogger $activity): AdminUserResource|JsonResponse
    {
        if (! $request->hasSession()) {
            return response()->json(['message' => __('api.stateful_required')], 400);
        }

        $credentials = [...$request->safe()->only(['email', 'password']), 'is_admin' => true];

        if (! Auth::guard('web')->attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => __('api.invalid_credentials')]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->forceFill(['last_login_at' => now()])->save();
        $activity->log('auth.login', $user);

        return AdminUserResource::make($user);
    }

    public function me(Request $request): AdminUserResource
    {
        return AdminUserResource::make($request->user());
    }

    public function logout(Request $request, ActivityLogger $activity): JsonResponse
    {
        $activity->log('auth.logout', $request->user());

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => __('api.logged_out')]);
    }
}
