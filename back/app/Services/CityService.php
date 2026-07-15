<?php

namespace App\Services;

use App\Http\Resources\CityResource;
use App\Models\City;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CityService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = City::query();

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

    public function create(array $data): CityResource
    {
        return DB::transaction(function () use ($data) {
            $record = City::create(['name' => $data['name']]);

            return new CityResource($record);
        });
    }

    public function update(City $city, array $data): CityResource
    {
        return DB::transaction(function () use ($city, $data) {
            $city->update(['name' => $data['name']]);

            return new CityResource($city);
        });
    }

    public function delete(City $city): void
    {
        DB::transaction(fn () => $city->delete());
    }
}
