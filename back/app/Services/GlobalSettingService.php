<?php

namespace App\Services;

use App\Http\Resources\GlobalSettingResource;
use App\Models\GlobalSetting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GlobalSettingService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = GlobalSetting::query()->withCount(['fields', 'records']);

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%' . $params['search'] . '%');
        }

        $sortBy = in_array($params['sort_by'] ?? '', $this->sortable, true)
            ? $params['sort_by']
            : 'created_at';
        $sortDir = ($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
    }

    /** Load an app with its field definitions (for the builder / configure form). */
    public function show(GlobalSetting $globalSetting): GlobalSettingResource
    {
        return new GlobalSettingResource($globalSetting->load('fields'));
    }

    public function create(array $data): GlobalSettingResource
    {
        return DB::transaction(function () use ($data) {
            $app = GlobalSetting::create(['name' => $data['name']]);
            $this->syncFields($app, $data['fields'] ?? []);

            return new GlobalSettingResource($app->load('fields'));
        });
    }

    public function update(GlobalSetting $globalSetting, array $data): GlobalSettingResource
    {
        return DB::transaction(function () use ($globalSetting, $data) {
            $globalSetting->update(['name' => $data['name']]);

            if (array_key_exists('fields', $data)) {
                $this->syncFields($globalSetting, $data['fields'] ?? []);
            }

            return new GlobalSettingResource($globalSetting->load('fields'));
        });
    }

    public function delete(GlobalSetting $globalSetting): void
    {
        DB::transaction(fn () => $globalSetting->delete());
    }

    /**
     * Upsert the app's field definitions. Existing fields (with an id) keep their
     * machine `key` stable across label edits so already-saved records stay valid;
     * new fields get a unique key derived from the label; removed fields are deleted.
     */
    private function syncFields(GlobalSetting $app, array $fields): void
    {
        $keepIds = [];

        foreach (array_values($fields) as $i => $f) {
            $type = $f['type'] ?? 'text';
            $payload = [
                'label'       => $f['label'],
                'type'        => $type,
                'options'     => $type === 'dropdown' ? array_values(array_filter($f['options'] ?? [])) : null,
                'is_required' => (bool) ($f['is_required'] ?? false),
                'sort_order'  => $i,
            ];

            $existing = ! empty($f['id']) ? $app->fields()->whereKey($f['id'])->first() : null;

            if ($existing) {
                $existing->update($payload);       // key stays stable
                $keepIds[] = $existing->id;
            } else {
                $payload['key'] = $this->uniqueKey($app, $payload['label']);
                $keepIds[] = $app->fields()->create($payload)->id;
            }
        }

        $app->fields()->whereNotIn('id', $keepIds ?: [0])->delete();
    }

    private function uniqueKey(GlobalSetting $app, string $label): string
    {
        $base = Str::snake(trim($label)) ?: 'field';
        $key = $base;
        $i = 2;

        while ($app->fields()->where('key', $key)->exists()) {
            $key = $base . '_' . $i++;
        }

        return $key;
    }
}
