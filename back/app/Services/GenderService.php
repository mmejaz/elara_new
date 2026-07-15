<?php

namespace App\Services;

use App\Http\Resources\GenderResource;
use App\Models\Gender;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GenderService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Gender::query();

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

    public function create(array $data): GenderResource
    {
        return DB::transaction(function () use ($data) {
            $record = Gender::create(['name' => $data['name']]);

            return new GenderResource($record);
        });
    }

    public function update(Gender $gender, array $data): GenderResource
    {
        return DB::transaction(function () use ($gender, $data) {
            $gender->update(['name' => $data['name']]);

            return new GenderResource($gender);
        });
    }

    public function delete(Gender $gender): void
    {
        DB::transaction(fn () => $gender->delete());
    }
}
