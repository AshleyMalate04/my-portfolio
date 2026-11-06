<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Project;
use Illuminate\Http\Request;

/**
 * Projecto no backoffice: inclui as notas internas (ocultas na API pública) e os ids das tecnologias.
 *
 * @mixin Project
 */
class AdminProjectResource extends AdminRecordResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...$this->resource->makeVisible('internal_notes')->toArray(),
            'technology_ids' => $this->whenLoaded('technologies', fn () => $this->technologies->pluck('id')->all()),
        ];
    }
}
