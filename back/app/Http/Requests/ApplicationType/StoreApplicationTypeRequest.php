<?php

namespace App\Http\Requests\ApplicationType;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:application_types,name'],
        ];
    }
}
