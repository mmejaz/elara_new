<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'status'        => $this->status ?? 'active',
            'status_reason' => $this->status_reason,
            'roles'      => $this->getRoleNames(),
            'organizations'    => $this->whenLoaded('organizations', fn () => $this->organizations->map(
                fn ($o) => ['id' => $o->id, 'name' => $o->name]
            )->values()),
            'organization_ids' => $this->whenLoaded('organizations', fn () => $this->organizations->pluck('id')->values()),
            'created_at' => $this->created_at->toDateString(),
        ];
    }
}
