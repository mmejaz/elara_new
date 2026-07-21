<?php

namespace App\Models\Concerns;

use App\Models\File;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Gives a model a polymorphic one-to-many relationship to files plus the whole
 * upload / attach / detach flow. Any module's model can `use HasFiles` to become
 * file-capable — this trait owns the entire file-handling process, including
 * config-driven validation and cleanup when the owner is deleted.
 *
 * Files are grouped per model by an optional `collection` (e.g. 'avatar',
 * 'logo_light', 'attachments').
 */
trait HasFiles
{
    /** Delete a model's files (record + physical) when the model itself is deleted. */
    public static function bootHasFiles(): void
    {
        static::deleting(function (Model $model) {
            $model->files->each->delete();
        });
    }

    public function files(): MorphMany
    {
        return $this->morphMany(File::class, 'fileable');
    }

    /** All files in a collection (or all files when no collection given). */
    public function filesIn(?string $collection = null): Collection
    {
        $relation = $this->files();

        if ($collection !== null) {
            $relation->where('collection', $collection);
        }

        return $relation->get();
    }

    /** The first/only file in a collection — handy for single-file fields. */
    public function fileIn(?string $collection = null): ?File
    {
        $relation = $this->files();

        if ($collection !== null) {
            $relation->where('collection', $collection);
        }

        return $relation->first();
    }

    /** Validate + upload a file and attach it to this model (allows many per collection). */
    public function attachFile(UploadedFile $file, ?string $collection = null): File
    {
        $this->validateUpload($file, $collection);

        $disk = config('files.disk', 'public');
        $meta = File::store($file, $disk, config('files.directory', 'files'));

        try {
            return DB::transaction(fn () => $this->files()->create([
                ...$meta,
                'collection'  => $collection,
                'uploaded_by' => Auth::id(),
            ]));
        } catch (\Throwable $e) {
            Storage::disk($disk)->delete($meta['path']); // don't leave an orphan on disk
            throw $e;
        }
    }

    /** Single-file collection: replace whatever's currently there. */
    public function attachSingleFile(UploadedFile $file, string $collection): File
    {
        // Validate before removing the old file so a bad upload keeps the current one.
        $this->validateUpload($file, $collection);

        $this->detachFiles($collection);

        return $this->attachFile($file, $collection);
    }

    /** Delete files (optionally within a collection), removing records + physical files. */
    public function detachFiles(?string $collection = null): void
    {
        $this->filesIn($collection)->each->delete();
    }

    /** Enforce the config-driven mime / size allowlist (per-collection overrides supported). */
    protected function validateUpload(UploadedFile $file, ?string $collection): void
    {
        $rules   = $collection ? config("files.collections.$collection", []) : [];
        $mimes   = $rules['mimes'] ?? config('files.mimes', []);
        $maxSize = $rules['max_size'] ?? config('files.max_size', 4096);

        Validator::make(
            ['file' => $file],
            ['file' => ['required', 'file', "max:$maxSize", 'mimes:' . implode(',', $mimes)]],
            [
                'file.mimes' => 'The file must be one of: ' . implode(', ', $mimes) . '.',
                'file.max'   => "The file may not be larger than {$maxSize} KB.",
            ],
        )->validate();
    }
}
