<?php

namespace App\Http\Requests\Country;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('country')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:countries,name,' . $id],
        ];
    }
}
