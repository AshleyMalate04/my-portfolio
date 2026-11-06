<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Cria (ou promove) uma conta de administrador. A palavra-passe é pedida de forma interactiva
 * e nunca é aceite como argumento, para não ficar no histórico do terminal.
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'admin:create {--name= : Nome a apresentar} {--email= : Email de acesso}';

    protected $description = 'Cria uma conta de administrador do backoffice';

    public function handle(): int
    {
        $name = $this->option('name') ?: text('Nome', required: true);
        $email = $this->option('email') ?: text('Email de acesso', required: true);
        $password = password('Palavra-passe (mín. 12 caracteres, com letras, números e símbolos)', required: true);
        $confirmation = password('Confirme a palavra-passe', required: true);

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password, 'password_confirmation' => $confirmation],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:254'],
                'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => strtolower($email)]);
        $existed = $user->exists;

        $user->forceFill([
            'name' => $name,
            'password' => $password,
            'is_admin' => true,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $this->info($existed
            ? "Conta {$user->email} actualizada e marcada como administradora."
            : "Administrador {$user->email} criado.");

        return self::SUCCESS;
    }
}
