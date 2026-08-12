<?php

namespace App\Http\Requests\ApplicationType;

use App\Models\ApplicationType;
use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', ApplicationType::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:application_types,name'],
        ];
    }
}
