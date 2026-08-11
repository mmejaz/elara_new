<?php

namespace App\Http\Requests\Department;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $department = $this->route('department');
        return auth()->user()->can('update', $department);
    }

    public function rules(): array
    {
        $id = $this->route('department')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,' . $id],
        ];
    }
}
