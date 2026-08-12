<?php

namespace App\Services;

use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrganizationService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Organization::query();

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

    public function create(array $data): OrganizationResource
    {
        return DB::transaction(function () use ($data) {
            $record = Organization::create(['name' => $data['name']]);

            return new OrganizationResource($record);
        });
    }

    public function update(Organization $organization, array $data): OrganizationResource
    {
        return DB::transaction(function () use ($organization, $data) {
            $organization->update(['name' => $data['name']]);

            return new OrganizationResource($organization);
        });
    }

    public function delete(Organization $organization): void
    {
        DB::transaction(fn () => $organization->delete());
    }
}
