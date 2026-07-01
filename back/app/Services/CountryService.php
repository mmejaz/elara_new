<?php

namespace App\Services;

use App\Http\Resources\CountryResource;
use App\Models\Country;
use Illuminate\Support\Facades\DB;

class CountryService
{
    public function getAll()
    {
        return CountryResource::collection(
            Country::latest()->get()
        );
    }

    public function create(array $data): CountryResource
    {
        return DB::transaction(function () use ($data) {
            $record = Country::create(['name' => $data['name']]);

            return new CountryResource($record);
        });
    }

    public function update(Country $country, array $data): CountryResource
    {
        return DB::transaction(function () use ($country, $data) {
            $country->update(['name' => $data['name']]);

            return new CountryResource($country);
        });
    }

    public function delete(Country $country): void
    {
        DB::transaction(fn () => $country->delete());
    }
}
