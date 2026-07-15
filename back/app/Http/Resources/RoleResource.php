<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public int $usersCount = 0;

    public function withUsersCount(int $count): static
    {
        $this->usersCount = $count;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            // `withCount('users')` (paginated path) sets users_count; otherwise
            // fall back to the value injected via withUsersCount() (getAll path).
            'users_count'       => $this->users_count ?? $this->usersCount,
            'permissions_count' => $this->whenLoaded('permissions', fn() => $this->permissions->count(), 0),
            'permissions'       => $this->whenLoaded('permissions', fn() => $this->permissions->pluck('name')),
        ];
    }
}
