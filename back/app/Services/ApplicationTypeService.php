<?php

namespace App\Services;

use App\Http\Resources\ApplicationTypeResource;
use App\Models\ApplicationType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ApplicationTypeService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = ApplicationType::query();

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

    public function create(array $data): ApplicationTypeResource
    {
        return DB::transaction(function () use ($data) {
            $record = ApplicationType::create(['name' => $data['name']]);

            return new ApplicationTypeResource($record);
        });
    }

    public function update(ApplicationType $applicationType, array $data): ApplicationTypeResource
    {
        return DB::transaction(function () use ($applicationType, $data) {
            $applicationType->update(['name' => $data['name']]);

            return new ApplicationTypeResource($applicationType);
        });
    }

    public function delete(ApplicationType $applicationType): void
    {
        DB::transaction(fn () => $applicationType->delete());
    }
}
