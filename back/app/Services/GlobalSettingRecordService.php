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

    /**
     * Save the app's values. Single-config: an app holds exactly one value-set,
     * so this updates the existing record if there is one, otherwise creates it.
     */
    public function create(GlobalSetting $app, array $data): GlobalSettingRecordResource
    {
        $record = DB::transaction(function () use ($app, $data) {
            $clean = $this->sanitize($app, $data);
            $existing = $app->records()->latest('id')->first();

            if ($existing) {
                $existing->update(['data' => $clean]);

                return $existing;
            }

            return $app->records()->create(['data' => $clean]);
        });

        return new GlobalSettingRecordResource($record);
    }

    public function update(GlobalSettingRecord $record, array $data): GlobalSettingRecordResource
    {
        DB::transaction(fn () => $record->update([
            'data' => $this->sanitize($record->globalSetting, $data),
        ]));

        return new GlobalSettingRecordResource($record);
    }

    /** Keep only values whose key matches a defined field. */
    private function sanitize(GlobalSetting $app, array $data): array
    {
        $keys = $app->fields()->pluck('key')->all();

        return array_intersect_key($data, array_flip($keys));
    }
}
