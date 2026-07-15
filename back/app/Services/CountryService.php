<?php

namespace App\Services;

use App\Http\Resources\CountryResource;
use App\Models\Country;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CountryService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Country::query();

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

    public function create(array $data): CountryResource
    {
        return DB::transaction(function () use ($data) {
            $record = Country::create(['name' => $data['name']]);

            return new CountryResource($record);
        });
    }

    public function update(Country $country, array $data): CountryResource
    {
        return DB::transaction(function () use ($country, $data) {
            $country->update(['name' => $data['name']]);

            return new CountryResource($country);
        });
    }

    public function delete(Country $country): void
    {
        DB::transaction(fn () => $country->delete());
    }
}
