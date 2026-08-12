<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'parent_id'])]
class Department extends Model
{
    /** The department this one sits under (null for a top-level department). */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /** Departments nested directly under this one. */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }
}
