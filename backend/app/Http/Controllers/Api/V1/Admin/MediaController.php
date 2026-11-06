<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreMediaRequest;
use App\Http\Resources\Api\V1\AdminMediaResource;
use App\Models\Media;
use App\Services\ActivityLogger;
use App\Services\MediaService;
use App\Support\Translatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * Biblioteca multimédia: carregar, pesquisar, editar texto alternativo, substituir (mantendo as
 * referências), ver onde cada ficheiro é usado e eliminar com confirmação.
 */
class MediaController extends Controller
{
    public function __construct(
        private readonly MediaService $media,
        private readonly ActivityLogger $activity,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'kind' => ['sometimes', 'nullable', 'in:image,document'],
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $page = Media::query()
            ->when($filters['kind'] ?? null, fn (Builder $q, string $kind) => $q->where('kind', $kind))
            ->when($filters['q'] ?? null, fn (Builder $q, string $term) => $q->whereRaw(
                'lower(original_name) like ? or lower(alt::text) like ?',
                array_fill(0, 2, '%'.addcslashes(Str::lower(trim($term)), '%_\\').'%'),
            ))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 30)
            ->withQueryString();

        $usage = $this->media->usageFor($page->getCollection()->pluck('id'));
        $page->getCollection()->each(fn (Media $m) => $m->setAttribute('usage', $usage[$m->id] ?? []));

        return AdminMediaResource::collection($page);
    }

    public function show(int $id): AdminMediaResource
    {
        $media = Media::query()->findOrFail($id);
        $media->setAttribute('usage', $this->media->usage($media));

        return AdminMediaResource::make($media);
    }

    public function store(StoreMediaRequest $request): JsonResponse
    {
        $media = $this->media->store($request->file('file'), $request->user(), $request->validated('alt'));
        $media->setAttribute('usage', []);
        $this->activity->log('media.uploaded', $media, ['kind' => $media->kind->value]);

        return AdminMediaResource::make($media)->response()->setStatusCode(201);
    }

    public function update(Request $request, int $id): AdminMediaResource
    {
        $media = Media::query()->findOrFail($id);
        $data = $request->validate(Translatable::text('alt', 'nullable', 255));

        $media->update(['alt' => Translatable::clean($data['alt'] ?? null)]);
        $media->setAttribute('usage', $this->media->usage($media));

        return AdminMediaResource::make($media);
    }

    /** Substitui o ficheiro: o id mantém-se e todas as referências passam a mostrar o novo conteúdo. */
    public function replace(StoreMediaRequest $request, int $id): AdminMediaResource
    {
        $media = $this->media->replace(Media::query()->findOrFail($id), $request->file('file'));
        $media->setAttribute('usage', $this->media->usage($media));
        $this->activity->log('media.replaced', $media);

        return AdminMediaResource::make($media);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $media = Media::query()->findOrFail($id);
        $usage = $this->media->usage($media);

        // Um ficheiro em uso só é eliminado com confirmação explícita (?force=1); as referências são limpas.
        if ($usage !== [] && ! $request->boolean('force')) {
            return response()->json(['message' => __('api.media_in_use'), 'usage' => $usage], 409);
        }

        $this->activity->log('media.deleted', null, ['media_id' => $media->id, 'original_name' => $media->original_name]);
        $this->media->delete($media);

        return response()->json(null, 204);
    }
}
