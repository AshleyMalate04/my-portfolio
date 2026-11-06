<?php

namespace Tests\Feature\Api\Admin;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** Pedidos do frontend autorizado recebem sessão (Sanctum stateful). */
    private const SPA_HEADERS = ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/admin/login'];

    public function test_admin_can_log_in_read_profile_and_log_out(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'admin@example.com', 'password' => 'Segura#2026pass']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'Segura#2026pass'], self::SPA_HEADERS)
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@example.com')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticatedAs($admin, 'web');
        $this->assertNotNull($admin->fresh()->last_login_at);
        $this->assertTrue(ActivityLog::query()->where('action', 'auth.login')->exists());

        $this->getJson('/api/v1/admin/auth/me', self::SPA_HEADERS)->assertOk()->assertJsonPath('data.id', $admin->id);

        $this->postJson('/api/v1/admin/auth/logout', [], self::SPA_HEADERS)->assertOk();
        $this->assertGuest('web');
    }

    public function test_invalid_credentials_are_rejected_with_a_generic_message(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com', 'password' => 'Segura#2026pass']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'errada'], self::SPA_HEADERS)
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'As credenciais indicadas não são válidas.');

        $this->assertGuest('web');
    }

    public function test_non_admin_accounts_cannot_log_in(): void
    {
        User::factory()->create(['email' => 'user@example.com', 'password' => 'Segura#2026pass']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => 'user@example.com', 'password' => 'Segura#2026pass'], self::SPA_HEADERS)
            ->assertUnprocessable();

        $this->assertGuest('web');
    }

    public function test_login_requires_a_request_from_the_authorised_frontend(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com', 'password' => 'Segura#2026pass']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'Segura#2026pass'])
            ->assertStatus(400);
    }

    public function test_admin_routes_require_authentication_and_admin_role(): void
    {
        $this->getJson('/api/v1/admin/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Sessão inexistente ou expirada. Inicie sessão novamente.');

        $this->actingAs(User::factory()->create(), 'web')
            ->getJson('/api/v1/admin/dashboard/summary')
            ->assertForbidden();
    }

    public function test_login_attempts_are_rate_limited(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com', 'password' => 'Segura#2026pass']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'errada'], self::SPA_HEADERS)
                ->assertUnprocessable();
        }

        $this->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'Segura#2026pass'], self::SPA_HEADERS)
            ->assertTooManyRequests();
    }

    public function test_dashboard_summary_reports_real_totals(): void
    {
        Project::factory()->published()->create();
        Project::factory()->count(2)->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->getJson('/api/v1/admin/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.projects', ['published' => 1, 'draft' => 2])
            ->assertJsonPath('data.media', ['total' => 0])
            ->assertJsonPath('data.skills', ['total' => 0, 'published' => 0])
            ->assertJsonCount(3, 'data.recent_changes');
    }
}
