<?php

namespace App\Http\Resources\Api\V1\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representação de um registo para o backoffice: todos os atributos editáveis, com as traduções
 * completas ({"pt": ..., "en": ...}) e as relações carregadas. Os campos marcados como #[Hidden]
 * nos modelos (palavras-passe, hashes de IP) continuam excluídos.
 *
 * Só é usado em rotas protegidas por auth:sanctum + can:access-admin.
 */
class AdminRecordResource extends JsonResource {}
