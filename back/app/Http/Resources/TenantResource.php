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
            // Which physical database backs this tenant — the thing you actually
            // need when debugging a DB-per-tenant install. Set by Stancl on create.
            'database'    => $this->tenancy_db_name,
            'admin_name'  => $this->admin_name,
            'admin_email' => $this->admin_email,
            'created_at'  => $this->created_at?->toDateTimeString(),
            'updated_at'  => $this->updated_at?->toDateTimeString(),
            // NOTE: `admin_password` is deliberately not exposed. TenantService
            // still writes it to the tenant's `data` column in plaintext for the
            // seeder to consume — that needs clearing post-provision, but it must
            // never leave the server in the meantime.
        ];
    }
}
