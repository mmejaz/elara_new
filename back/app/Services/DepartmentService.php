<?php

namespace App\Services;

use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DepartmentService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        // Eager-load the parent so the "Parent Department" column never triggers
        // an N+1 across the page's rows.
        $query = Department::query()->with('parent');

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

    public function create(array $data): DepartmentResource
    {
        return DB::transaction(function () use ($data) {
            $record = Department::create([
                'name'      => $data['name'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            return new DepartmentResource($record->load('parent'));
        });
    }

    public function update(Department $department, array $data): DepartmentResource
    {
        return DB::transaction(function () use ($department, $data) {
            $department->update([
                'name'      => $data['name'],
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            return new DepartmentResource($department->load('parent'));
        });
    }

    public function delete(Department $department): void
    {
        DB::transaction(fn () => $department->delete());
    }
}
