<?php

namespace App\Http\Requests\ApplicationType;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('applicationType')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:application_types,name,' . $id],
        ];
    }
}
