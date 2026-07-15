<?php

namespace App\Services;

use App\Http\Resources\GlobalSettingRecordResource;
use App\Models\GlobalSetting;
use App\Models\GlobalSettingRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GlobalSettingRecordService
{
    /** Paginated + searchable rows for one app. Search scans the stored JSON. */
    public function paginate(GlobalSetting $app, array $params): LengthAwarePaginator
    {
        $query = $app->records()->getQuery();

        if (! empty($params['search'])) {
            $query->where('data', 'like', '%' . $params['search'] . '%');
        }

        $sortDir = ($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy('id', $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
    }

    public function create(GlobalSetting $app, array $data): GlobalSettingRecordResource
    {
        $record = DB::transaction(fn () => $app->records()->create([
            'data' => $this->sanitize($app, $data),
        ]));

        return new GlobalSettingRecordResource($record);
    }

    public function update(GlobalSettingRecord $record, array $data): GlobalSettingRecordResource
    {
        DB::transaction(fn () => $record->update([
            'data' => $this->sanitize($record->globalSetting, $data),
        ]));

        return new GlobalSettingRecordResource($record);
    }

    public function delete(GlobalSettingRecord $record): void
    {
        DB::transaction(fn () => $record->delete());
    }

    /** Keep only values whose key matches a defined field. */
    private function sanitize(GlobalSetting $app, array $data): array
    {
        $keys = $app->fields()->pluck('key')->all();

        return array_intersect_key($data, array_flip($keys));
    }
}
