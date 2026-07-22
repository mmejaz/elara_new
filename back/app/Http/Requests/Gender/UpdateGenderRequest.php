<?php

namespace App\Http\Requests\Gender;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGenderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('gender')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:genders,name,' . $id],
        ];
    }
}
