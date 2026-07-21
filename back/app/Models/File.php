<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'fileable_id', 'fileable_type', 'collection',
    'name', 'original_name', 'disk', 'path', 'mime_type', 'extension', 'size', 'uploaded_by',
])]
class File extends Model
{
    protected $appends = ['url'];

    /** The model this file belongs to. */
    public function fileable(): MorphTo
    {
        return $this->morphTo();
    }

    /** Public URL for the stored file. */
    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * Store an uploaded file on disk and return the metadata for a File record.
     * Attaching it to an owner is the HasFiles trait's job.
     */
    public static function store(UploadedFile $file, string $disk, string $directory): array
    {
        // Baseline guard even if a caller reaches store() directly.
        if (! $file->isValid()) {
            throw new \RuntimeException('The uploaded file is not valid.');
        }

        // Laravel's store() names the file with a random hash + a content-guessed
        // extension, so the path is never derived from client input.
        $path = $file->store($directory, $disk);

        return [
            'name'          => basename($path),
            'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
            'disk'          => $disk,
            'path'          => $path,
            'mime_type'     => $file->getMimeType(),
            'extension'     => strtolower($file->getClientOriginalExtension()),
            'size'          => $file->getSize(),
        ];
    }

    /** Remove the physical file when the record is deleted. */
    protected static function booted(): void
    {
        static::deleting(function (self $file) {
            Storage::disk($file->disk)->delete($file->path);
        });
    }
}
