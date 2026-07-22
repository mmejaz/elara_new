<?php

namespace App\Http\Requests\City;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('city')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:cities,name,' . $id],
        ];
    }
}
