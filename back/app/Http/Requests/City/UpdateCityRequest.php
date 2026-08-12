<?php

namespace App\Http\Requests\City;

use App\Models\City;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $city = $this->route('city');
        return auth()->user()->can('update', $city);
    }

    public function rules(): array
    {
        $id = $this->route('city')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:cities,name,' . $id],
        ];
    }
}
