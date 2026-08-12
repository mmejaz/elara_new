<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'parent_id', 'organization_id'])]
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

    /** The owning organization — null means a shared, tenant-wide department. */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Departments an organization may use: its own + tenant-wide shared ones
     * (organization_id null) + any owned by an ancestor organization. Passing
     * null (no organization context) returns everything — the management list.
     */
    public function scopeAvailableTo(Builder $query, ?int $organizationId): Builder
    {
        if ($organizationId === null) {
            return $query;
        }

        $ancestorIds = Organization::ancestorIdsOf($organizationId);

        return $query->where(
            fn (Builder $q) => $q
                ->whereNull('organization_id')
                ->orWhereIn('organization_id', $ancestorIds)
        );
    }
}
