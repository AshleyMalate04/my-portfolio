<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

/**
 * Garante que TODAS as rotas administrativas (incluindo as que forem acrescentadas no futuro)
 * exigem sessão e conta de administrador no servidor.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /** Rotas públicas por natureza (antes de haver sessão). */
    private const PUBLIC = ['auth.login', 'auth.options', 'auth.forgot-password', 'auth.reset-password'];

    /** @return list<array{method: string, uri: string, name: string}> */
    private function protectedRoutes(): array
    {
        return collect(RouteFacade::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => str_starts_with((string) $route->getName(), 'api.v1.admin.'))
            ->reject(fn (Route $route) => in_array(substr((string) $route->getName(), strlen('api.v1.admin.')), self::PUBLIC, true))
            ->map(fn (Route $route) => [
                'method' => collect($route->methods())->reject(fn ($m) => $m === 'HEAD')->first(),
                'uri' => '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri()),
                'name' => (string) $route->getName(),
            ])
            ->values()
            ->all();
    }

    public function test_there_are_admin_routes_to_check(): void
    {
        $this->assertGreaterThan(80, count($this->protectedRoutes()));
    }

    public function test_guests_receive_401_on_every_admin_route(): void
    {
        foreach ($this->protectedRoutes() as $route) {
            $this->json($route['method'], $route['uri'])
                ->assertStatus(401, "A rota {$route['name']} não exigiu autenticação.");
        }
    }

    public function test_non_admin_accounts_receive_403_on_every_admin_route(): void
    {
        $this->actingAs(User::factory()->create(), 'web');

        foreach ($this->protectedRoutes() as $route) {
            $this->json($route['method'], $route['uri'])
                ->assertStatus(403, "A rota {$route['name']} não exigiu conta de administrador.");
        }
    }
}
