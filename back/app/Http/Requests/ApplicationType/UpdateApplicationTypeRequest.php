<?php

namespace App\Http\Requests\ApplicationType;

use App\Models\ApplicationType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $applicationType = $this->route('applicationType');
        return auth()->user()->can('update', $applicationType);
    }

    public function rules(): array
    {
        $id = $this->route('applicationType')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:application_types,name,' . $id],
        ];
    }
}
