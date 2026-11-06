<?php

namespace Tests\Feature\Console;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_administrator_with_a_hashed_password(): void
    {
        $this->artisan('admin:create', ['--name' => 'Ashley', '--email' => 'Ashley@Example.com'])
            ->expectsQuestion('Palavra-passe (mín. 12 caracteres, com letras, números e símbolos)', 'Muito#Segura2026')
            ->expectsQuestion('Confirme a palavra-passe', 'Muito#Segura2026')
            ->assertSuccessful();

        $user = User::query()->sole();

        $this->assertSame('ashley@example.com', $user->email);
        $this->assertTrue($user->isAdmin());
        $this->assertTrue(Hash::check('Muito#Segura2026', $user->password));
    }

    public function test_weak_or_mismatched_passwords_are_rejected(): void
    {
        $this->artisan('admin:create', ['--name' => 'Ashley', '--email' => 'ashley@example.com'])
            ->expectsQuestion('Palavra-passe (mín. 12 caracteres, com letras, números e símbolos)', 'curta')
            ->expectsQuestion('Confirme a palavra-passe', 'curta')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }
}
