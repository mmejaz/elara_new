<?php

namespace App\Services;

use App\Http\Resources\LeaveTypeResource;
use App\Models\LeaveType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LeaveTypeService
{
    /** Columns that may be sorted from the client (whitelist). */
    private array $sortable = ['name', 'created_at', 'id'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = LeaveType::query();

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

    public function create(array $data): LeaveTypeResource
    {
        return DB::transaction(function () use ($data) {
            $record = LeaveType::create(['name' => $data['name']]);

            return new LeaveTypeResource($record);
        });
    }

    public function update(LeaveType $leaveType, array $data): LeaveTypeResource
    {
        return DB::transaction(function () use ($leaveType, $data) {
            $leaveType->update(['name' => $data['name']]);

            return new LeaveTypeResource($leaveType);
        });
    }

    public function delete(LeaveType $leaveType): void
    {
        DB::transaction(fn () => $leaveType->delete());
    }
}
