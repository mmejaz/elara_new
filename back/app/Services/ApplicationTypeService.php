<?php

namespace App\Services;

use App\Http\Resources\ApplicationTypeResource;
use App\Models\ApplicationType;
use Illuminate\Support\Facades\DB;

class ApplicationTypeService
{
    public function getAll()
    {
        return ApplicationTypeResource::collection(
            ApplicationType::latest()->get()
        );
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
