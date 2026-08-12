<?php

namespace App\Http\Requests\Gender;

use App\Models\Gender;
use Illuminate\Foundation\Http\FormRequest;

class StoreGenderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', Gender::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:genders,name'],
        ];
    }
}
