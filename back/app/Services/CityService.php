<?php

namespace App\Services;

use App\Http\Resources\CityResource;
use App\Models\City;
use Illuminate\Support\Facades\DB;

class CityService
{
    public function getAll()
    {
        return CityResource::collection(
            City::latest()->get()
        );
    }

    public function create(array $data): CityResource
    {
        return DB::transaction(function () use ($data) {
            $record = City::create(['name' => $data['name']]);

            return new CityResource($record);
        });
    }

    public function update(City $city, array $data): CityResource
    {
        return DB::transaction(function () use ($city, $data) {
            $city->update(['name' => $data['name']]);

            return new CityResource($city);
        });
    }

    public function delete(City $city): void
    {
        DB::transaction(fn () => $city->delete());
    }
}
