<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'status'     => $this->status ?? 'active',
            'email'      => $this->email,
            'phone'      => $this->phone,
            'timezone'   => $this->timezone,
            'currency'   => $this->currency,
            'language'   => $this->language,
            'domains'    => $this->whenLoaded('domains', fn () => $this->domains->pluck('domain')),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
