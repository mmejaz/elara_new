<?php

namespace App\Http\Requests\Country;

use App\Models\Country;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $country = $this->route('country');
        return auth()->user()->can('update', $country);
    }

    public function rules(): array
    {
        $id = $this->route('country')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:countries,name,' . $id],
        ];
    }
}
