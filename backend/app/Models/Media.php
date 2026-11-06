<?php

namespace App\Models;

use App\Enums\MediaKind;
use App\Models\Concerns\HasTranslations;
use Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'disk', 'path', 'original_name', 'mime_type', 'extension', 'size',
    'width', 'height', 'kind', 'alt', 'checksum', 'uploaded_by',
])]
class Media extends Model
{
    /** @use HasFactory<MediaFactory> */
    use HasFactory, HasTranslations;

    protected array $translatable = ['alt'];

    /** O URL público acompanha sempre o registo (útil no backoffice). */
    protected $appends = ['url'];

    protected static function booted(): void
    {
        // O ficheiro só é removido depois de a transacção confirmar a eliminação do registo,
        // evitando ficheiros apagados com registos ainda presentes (ou o inverso).
        static::deleted(function (Media $media): void {
            DB::afterCommit(fn () => Storage::disk($media->disk)->delete($media->path));
        });
    }

    protected function casts(): array
    {
        return [
            'kind' => MediaKind::class,
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk($this->disk)->url($this->path));
    }
}
