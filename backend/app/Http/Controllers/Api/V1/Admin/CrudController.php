<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Admin\AdminRecordResource;
use App\Services\ActivityLogger;
use App\Support\Translatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Base dos recursos do backoffice com listagem (pesquisa, filtros, paginação), criação, edição,
 * eliminação e ordenação manual. Cada recurso define o modelo, o Form Request e os ganchos necessários.
 *
 * A autorização é aplicada no grupo de rotas (auth:sanctum + can:access-admin) e repetida
 * nos Form Requests; o frontend nunca é a única barreira.
 *
 * @template TModel of Model
 */
abstract class CrudController extends Controller
{
    /** @var class-string<TModel> */
    protected string $model;

    /** @var class-string<FormRequest> */
    protected string $request;

    /** Nome usado no registo de actividade (ex.: "service"). */
    protected string $logName;

    /** @var list<string> Relações carregadas nas respostas. */
    protected array $with = [];

    /** @var list<string> Colunas pesquisadas por ?q= (texto ou JSON traduzível). */
    protected array $searchable = [];

    /** @var array<string, string> Parâmetro da query → coluna para filtros exactos. */
    protected array $filters = [];

    /** @var class-string<AdminRecordResource> Formato das respostas. */
    protected string $resource = AdminRecordResource::class;

    /** O recurso tem ordenação manual (coluna sort_order). */
    protected bool $sortable = true;

    public function __construct(protected readonly ActivityLogger $activity) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $this->newQuery()->with($this->with);
        $this->applySearch($query, $validated['q'] ?? null);

        foreach ($this->filters as $parameter => $column) {
            if ($request->filled($parameter)) {
                $value = $request->input($parameter);
                $query->where($column, is_string($value) && in_array($value, ['true', 'false'], true) ? $value === 'true' : $value);
            }
        }

        $this->applyOrdering($query);

        return $this->resource::collection($query->paginate($validated['per_page'] ?? 50)->withQueryString());
    }

    public function show(int $id): AdminRecordResource
    {
        return $this->resource::make($this->find($id)->load($this->with));
    }

    public function store(): JsonResponse
    {
        $request = $this->validatedRequest();

        $record = DB::transaction(function () use ($request) {
            $data = $this->prepare($request->validated(), null);

            if ($this->sortable && ! array_key_exists('sort_order', $data)) {
                $data['sort_order'] = (int) $this->newQuery()->max('sort_order') + 1;
            }

            $record = $this->model::query()->create($data);
            $this->afterSave($record, $request->validated());

            return $record;
        });

        $this->activity->log("{$this->logName}.created", $record);

        return $this->resource::make($record->fresh($this->with))
            ->additional(['message' => __('admin.created')])
            ->response()
            ->setStatusCode(201);
    }

    public function update(int $id): JsonResponse
    {
        $record = $this->find($id);
        $request = $this->validatedRequest();

        DB::transaction(function () use ($record, $request) {
            $record->update($this->prepare($request->validated(), $record));
            $this->afterSave($record, $request->validated());
        });

        $this->activity->log("{$this->logName}.updated", $record, ['fields' => array_keys($request->validated())]);

        return $this->resource::make($record->fresh($this->with))
            ->additional(['message' => __('admin.updated')])
            ->response();
    }

    public function destroy(int $id): JsonResponse
    {
        $record = $this->find($id);
        $this->beforeDelete($record);

        DB::transaction(fn () => $record->delete());
        $this->activity->log("{$this->logName}.deleted", null, ['id' => $id]);

        return response()->json(['message' => __('admin.deleted')]);
    }

    /** Recebe a lista completa de ids pela nova ordem e grava sort_order numa transacção. */
    public function reorder(Request $request): JsonResponse
    {
        abort_unless($this->sortable, 404);

        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ])['ids'];

        $scope = $this->reorderScope($request);
        $existing = (clone $scope)->whereIn('id', $ids)->count();

        if ($existing !== count($ids)) {
            throw ValidationException::withMessages(['ids' => __('admin.reorder_invalid')]);
        }

        DB::transaction(function () use ($ids, $scope) {
            foreach ($ids as $position => $id) {
                (clone $scope)->whereKey($id)->update(['sort_order' => $position]);
            }
        });

        $this->activity->log("{$this->logName}.reordered");

        return response()->json(['message' => __('admin.reordered')]);
    }

    /**
     * Transforma os dados validados antes de gravar (por omissão limpa as traduções vazias).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function prepare(array $data, ?Model $record): array
    {
        $translatable = method_exists($this->model, 'getTranslatableAttributes')
            ? (new $this->model)->getTranslatableAttributes()
            : [];

        foreach ($translatable as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = Translatable::clean($data[$field]);
            }
        }

        return $data;
    }

    /** @param array<string, mixed> $validated */
    protected function afterSave(Model $record, array $validated): void {}

    protected function beforeDelete(Model $record): void {}

    /** @return Builder<TModel> */
    protected function newQuery(): Builder
    {
        return $this->model::query();
    }

    /** @return Builder<TModel> Registos que podem ser ordenados juntos (ex.: competências da mesma categoria). */
    protected function reorderScope(Request $request): Builder
    {
        return $this->newQuery();
    }

    /** @param Builder<TModel> $query */
    protected function applyOrdering(Builder $query): void
    {
        $this->sortable ? $query->orderBy('sort_order')->orderBy('id') : $query->latest('id');
    }

    /** @param Builder<TModel> $query */
    protected function applySearch(Builder $query, ?string $term): void
    {
        if ($term === null || trim($term) === '' || $this->searchable === []) {
            return;
        }

        $like = '%'.addcslashes(Str::lower(trim($term)), '%_\\').'%';

        $query->where(function (Builder $query) use ($like) {
            foreach ($this->searchable as $column) {
                // ::text permite pesquisar tanto colunas de texto como JSONB traduzível.
                $query->orWhereRaw('lower('.$query->getGrammar()->wrap($column).'::text) like ?', [$like]);
            }
        });
    }

    /** @return TModel */
    protected function find(int $id): Model
    {
        return $this->newQuery()->findOrFail($id);
    }

    protected function validatedRequest(): FormRequest
    {
        // Resolver um FormRequest no contentor executa a autorização e a validação.
        return app($this->request);
    }
}
