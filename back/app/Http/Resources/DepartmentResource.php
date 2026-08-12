<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'organization_id' => $this->organization_id,
            // Null = a shared, tenant-wide department. Otherwise the owning org.
            'organization'    => $this->whenLoaded('organization', fn () => $this->organization
                ? ['id' => $this->organization->id, 'name' => $this->organization->name]
                : null),
            'parent_id'       => $this->parent_id,
            // Minimal parent summary for the table's "Parent Department" column
            // and the edit drawer's prefill. Null for a top-level department.
            'parent'     => $this->whenLoaded('parent', fn () => $this->parent
                ? ['id' => $this->parent->id, 'name' => $this->parent->name]
                : null),
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
