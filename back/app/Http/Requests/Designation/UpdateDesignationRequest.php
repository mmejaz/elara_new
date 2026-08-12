<?php

namespace App\Http\Requests\Designation;

use App\Models\Designation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $designation = $this->route('designation');
        return auth()->user()->can('update', $designation);
    }

    public function rules(): array
    {
        $id = $this->route('designation')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:designations,name,' . $id],
        ];
    }
}
