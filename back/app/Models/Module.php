<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable([
    'name',
    'slug',
    'icon',
    'type',
    'is_resourceful',
    'parent_id',
    'order',
    'is_visible',
    'is_system',
    'description',
    'meta',
])]
class Module extends Model
{
    use SoftDeletes;

    protected $casts = [
        'is_resourceful' => 'boolean',
        'is_visible'     => 'boolean',
        'is_system'      => 'boolean',
        'meta'           => 'array',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Module::class, 'parent_id')->ordered();
    }

    /**
     * Visible children with their descendants eager-loaded, for the sidebar
     * tree. Inactive (is_visible = false) modules are excluded at every level.
     */
    public function childrenRecursive(): HasMany
    {
        return $this->children()->where('is_visible', true)->with('childrenRecursive');
    }

    /** Only visible modules. */
    #[Scope]
    protected function visible(Builder $query): Builder
    {
        return $query->where('is_visible', true);
    }

    /** Sorted by sidebar position, then id for stability. */
    #[Scope]
    protected function ordered(Builder $query): Builder
    {
        return $query->orderBy('order')->orderBy('id');
    }

    /** Top-level entries (sections / root items). */
    #[Scope]
    protected function roots(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /**
     * The Spatie permission keys this module implies, in "{module}.{action}"
     * form with spaces collapsed to underscores — e.g. "user_info.view_data".
     */
    public function permissionNames(array $actions = ['view', 'create', 'edit', 'delete', 'export']): array
    {
        $module = Str::snake($this->name);

        return array_map(fn (string $action) => $module . '.' . Str::snake($action), $actions);
    }
}
