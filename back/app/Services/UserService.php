<?php

namespace App\Services;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    /** Server-side paginated + searchable user list (name, email, or role). */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = User::query()->with('roles');

        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhereHas('roles', fn ($r) => $r->where('name', 'like', '%' . $search . '%'));
            });
        }

        $sortable = ['name', 'email', 'created_at', 'id'];
        $sortBy = in_array($params['sort_by'] ?? '', $sortable, true) ? $params['sort_by'] : 'created_at';
        $sortDir = ($params['sort_dir'] ?? 'asc') === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
    }

    /** Aggregate counts for the Users page stat cards (unaffected by pagination). */
    public function stats(): array
    {
        $total = User::count();
        // Count actual users that have a role (avoids orphaned model_has_roles rows).
        $withRole = User::whereHas('roles')->count();

        return [
            'total'        => $total,
            'with_role'    => $withRole,
            'without_role' => max(0, $total - $withRole),
        ];
    }

    public function create(array $data): UserResource
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => $data['password'],
            ]);

            $user->assignRole($data['role']);

            return new UserResource($user->load('roles'));
        });
    }

    public function update(User $user, array $data): UserResource
    {
        return DB::transaction(function () use ($user, $data) {
            $user->name = $data['name'];
            $user->email = $data['email'];

            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }

            $user->save();
            $user->syncRoles([$data['role']]);

            return new UserResource($user->load('roles'));
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(fn () => $user->delete());
    }
}
