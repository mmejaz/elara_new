<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'parent_id'  => $this->parent_id,
            // Minimal parent summary for the table's "Parent Department" column
            // and the edit drawer's prefill. Null for a top-level department.
            'parent'     => $this->whenLoaded('parent', fn () => $this->parent
                ? ['id' => $this->parent->id, 'name' => $this->parent->name]
                : null),
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
