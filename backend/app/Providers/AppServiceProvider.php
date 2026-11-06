<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Em desenvolvimento, falha cedo perante lazy loading, atributos inexistentes ou atribuição em massa ignorada.
        Model::shouldBeStrict(! $this->app->isProduction());

        // Toda a área administrativa exige uma conta marcada como administradora.
        Gate::define('access-admin', fn (User $user): bool => $user->isAdmin());

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));

        RateLimiter::for('admin-login', function (Request $request) {
            $email = Str::lower((string) $request->input('email'));

            return [
                Limit::perMinute(5)->by('login:'.$email.'|'.$request->ip()),
                Limit::perMinute(20)->by('login-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinutes(10, 6)->by('reset:'.$request->ip()));

        // A ligação de recuperação aponta para a página do frontend, não para uma rota do Laravel.
        ResetPassword::createUrlUsing(fn (User $user, string $token) => rtrim(config('portfolio.frontend_url'), '/')
            .'/admin/redefinir-palavra-passe?'.http_build_query(['token' => $token, 'email' => $user->email]));
    }
}
