<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'parent_id'])]
class Organization extends Model
{
    /** The organization this one sits under (null for a top-level organization). */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    /** Organizations nested directly under this one. */
    public function children(): HasMany
    {
        return $this->hasMany(Organization::class, 'parent_id');
    }

    /**
     * The organization's own id plus every ancestor's, walking up parent_id.
     * Used to resolve which scoped departments an organization inherits.
     */
    public static function ancestorIdsOf(int $organizationId): array
    {
        $ids = [];
        $current = static::find($organizationId);
        $guard = 0;

        while ($current && $guard++ < 100) {
            $ids[] = $current->id;
            $current = $current->parent_id ? static::find($current->parent_id) : null;
        }

        return $ids;
    }
}
