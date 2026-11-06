<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base dos pedidos do backoffice: exige administrador e distingue criação (POST, campos obrigatórios)
 * de edição (PUT/PATCH, campos opcionais — permite alterações parciais como publicar/ocultar).
 */
abstract class AdminFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /** "required" ao criar, "sometimes" ao editar. */
    protected function presence(): string
    {
        return $this->isMethod('POST') ? 'required' : 'sometimes';
    }

    /** Id do registo em edição (parâmetro {id} da rota), ou null ao criar. */
    protected function recordId(): ?int
    {
        $id = $this->route('id');

        return is_numeric($id) ? (int) $id : null;
    }

    /** Regra de slug legível: minúsculas, números e hífenes. */
    protected function slugRules(string $table): array
    {
        return [
            $this->presence(),
            'string',
            'max:120',
            'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            "unique:{$table},slug".($this->recordId() ? ','.$this->recordId() : ''),
        ];
    }

    /** URL externa segura (apenas http/https). */
    protected function urlRules(): array
    {
        return ['nullable', 'string', 'max:2048', 'url:http,https'];
    }

    protected function dateRules(): array
    {
        return ['nullable', 'date_format:Y-m-d'];
    }
}
