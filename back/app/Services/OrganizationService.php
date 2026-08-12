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
        // Eager-load the parent so the "Parent Organization" column never
        // triggers an N+1 across the page's rows.
        $query = Organization::query()->with('parent');

        // Super Admins see every organization; everyone else is limited to the
        // organizations they are assigned to (organization_user). This scopes
        // both the management list and the header switcher.
        $user = auth()->user();
        if ($user && ! $user->seesAllOrganizations()) {
            $query->whereIn('id', $user->organizations()->select('organizations.id'));
        }

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
            $record = Organization::create([
                'name'      => $data['name'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            return new OrganizationResource($record->load('parent'));
        });
    }

    public function update(Organization $organization, array $data): OrganizationResource
    {
        return DB::transaction(function () use ($organization, $data) {
            $organization->update([
                'name'      => $data['name'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            return new OrganizationResource($organization->load('parent'));
        });
    }

    public function delete(Organization $organization): void
    {
        DB::transaction(fn () => $organization->delete());
    }
}
