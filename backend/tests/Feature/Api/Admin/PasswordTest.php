<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_recovery_is_unavailable_without_email_delivery(): void
    {
        config(['portfolio.password_reset_enabled' => false]);

        $this->getJson('/api/v1/admin/auth/options')->assertJsonPath('data.password_reset', false);
        $this->postJson('/api/v1/admin/auth/forgot-password', ['email' => 'a@example.com'])->assertStatus(503);
    }

    public function test_reset_link_is_sent_only_to_administrators_with_a_generic_answer(): void
    {
        config(['portfolio.password_reset_enabled' => true]);
        Notification::fake();
        $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);
        $user = User::factory()->create(['email' => 'user@example.com']);

        $adminResponse = $this->postJson('/api/v1/admin/auth/forgot-password', ['email' => 'admin@example.com'])->assertOk();
        $userResponse = $this->postJson('/api/v1/admin/auth/forgot-password', ['email' => 'user@example.com'])->assertOk();
        $missingResponse = $this->postJson('/api/v1/admin/auth/forgot-password', ['email' => 'ninguem@example.com'])->assertOk();

        $this->assertSame($adminResponse->json('message'), $userResponse->json('message'));
        $this->assertSame($adminResponse->json('message'), $missingResponse->json('message'));

        Notification::assertSentTo($admin, ResetPassword::class, function (ResetPassword $notification) use ($admin) {
            $url = (new \ReflectionProperty($notification, 'token'))->getValue($notification);

            return str_contains($notification->toMail($admin)->actionUrl, '/admin/redefinir-palavra-passe?token='.$url);
        });
        Notification::assertNotSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        config(['portfolio.password_reset_enabled' => true]);
        Notification::fake();
        $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);

        $this->postJson('/api/v1/admin/auth/forgot-password', ['email' => 'admin@example.com']);
        $token = null;
        Notification::assertSentTo($admin, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/v1/admin/auth/reset-password', [
            'token' => 'invalido', 'email' => 'admin@example.com',
            'password' => 'Nova#Segura2026', 'password_confirmation' => 'Nova#Segura2026',
        ])->assertJsonValidationErrors(['email']);

        $this->postJson('/api/v1/admin/auth/reset-password', [
            'token' => $token, 'email' => 'admin@example.com',
            'password' => 'fraca', 'password_confirmation' => 'fraca',
        ])->assertJsonValidationErrors(['password']);

        $this->postJson('/api/v1/admin/auth/reset-password', [
            'token' => $token, 'email' => 'admin@example.com',
            'password' => 'Nova#Segura2026', 'password_confirmation' => 'Nova#Segura2026',
        ])->assertOk();

        $this->assertTrue(Hash::check('Nova#Segura2026', $admin->fresh()->password));
    }

    public function test_logged_in_admin_can_change_password_with_the_current_one(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'Actual#Segura2026']);
        $this->actingAs($admin, 'web');

        $this->putJson('/api/v1/admin/auth/password', [
            'current_password' => 'errada',
            'password' => 'Outra#Segura2026', 'password_confirmation' => 'Outra#Segura2026',
        ])->assertJsonValidationErrors(['current_password']);

        $this->putJson('/api/v1/admin/auth/password', [
            'current_password' => 'Actual#Segura2026',
            'password' => 'Outra#Segura2026', 'password_confirmation' => 'Outra#Segura2026',
        ])->assertOk();

        $this->assertTrue(Hash::check('Outra#Segura2026', $admin->fresh()->password));
    }
}
