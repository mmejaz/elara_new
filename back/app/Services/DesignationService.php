<?php

namespace App\Services;

use App\Http\Resources\DesignationResource;
use App\Models\Designation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DesignationService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Designation::query();

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

    public function create(array $data): DesignationResource
    {
        return DB::transaction(function () use ($data) {
            $record = Designation::create(['name' => $data['name']]);

            return new DesignationResource($record);
        });
    }

    public function update(Designation $designation, array $data): DesignationResource
    {
        return DB::transaction(function () use ($designation, $data) {
            $designation->update(['name' => $data['name']]);

            return new DesignationResource($designation);
        });
    }

    public function delete(Designation $designation): void
    {
        DB::transaction(fn () => $designation->delete());
    }
}
