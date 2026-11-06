<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/**
 * Recuperação de palavra-passe (só quando há envio de email configurado) e alteração com sessão iniciada.
 * As respostas nunca revelam se um email existe.
 */
class PasswordController extends Controller
{
    /** Indica ao frontend que funcionalidades de autenticação estão disponíveis. */
    public function options(): JsonResponse
    {
        return response()->json(['data' => ['password_reset' => (bool) config('portfolio.password_reset_enabled')]]);
    }

    public function forgot(Request $request): JsonResponse
    {
        abort_unless(config('portfolio.password_reset_enabled'), 503, __('admin.password_reset_disabled'));

        $email = Str::lower($request->validate(['email' => ['required', 'email', 'max:254']])['email']);

        // Só contas de administrador recebem a ligação; a resposta é sempre a mesma.
        if (User::query()->where('email', $email)->where('is_admin', true)->exists()) {
            Password::broker()->sendResetLink(['email' => $email]);
        }

        return response()->json(['message' => __('admin.password_reset_sent')]);
    }

    public function reset(Request $request, ActivityLogger $activity): JsonResponse
    {
        abort_unless(config('portfolio.password_reset_enabled'), 503, __('admin.password_reset_disabled'));

        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:254'],
            'password' => ['required', 'confirmed', self::strength()],
        ]);

        $status = Password::broker()->reset(
            [...$data, 'email' => Str::lower($data['email'])],
            function (User $user, string $password) use ($activity) {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                event(new PasswordReset($user));
                $activity->log('auth.password_reset', $user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __('admin.password_reset_invalid')]);
        }

        return response()->json(['message' => __('admin.password_reset_done')]);
    }

    /** Alteração com sessão iniciada; exige a palavra-passe actual e invalida as outras sessões. */
    public function change(Request $request, ActivityLogger $activity): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', 'different:current_password', self::strength()],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => __('admin.current_password_invalid')]);
        }

        $user->forceFill(['password' => $data['password'], 'remember_token' => Str::random(60)])->save();
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
        $activity->log('auth.password_changed', $user);

        return response()->json(['message' => __('admin.password_changed')]);
    }

    public static function strength(): PasswordRule
    {
        return PasswordRule::min(12)->letters()->mixedCase()->numbers()->symbols();
    }
}
