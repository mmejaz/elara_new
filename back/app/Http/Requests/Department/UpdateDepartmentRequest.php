<?php

namespace App\Http\Requests\Department;

use App\Models\Department;
use App\Support\DepartmentMode;
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
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,'.$id],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:departments,id',
                // A department can be neither its own parent nor a child of one of
                // its own descendants (which would create a cycle).
                function (string $attribute, $value, \Closure $fail) use ($id): void {
                    if ((int) $value === (int) $id) {
                        $fail('A department cannot be its own parent.');

                        return;
                    }

                    // Walk up from the chosen parent; reaching this department
                    // means the chosen parent lives inside its subtree.
                    $ancestor = Department::find($value);
                    $guard = 0;

                    while ($ancestor && $guard++ < 100) {
                        if ((int) $ancestor->id === (int) $id) {
                            $fail('Cannot set a descendant department as the parent (circular hierarchy).');

                            return;
                        }

                        $ancestor = $ancestor->parent_id ? Department::find($ancestor->parent_id) : null;
                    }
                },
            ],
            'organization_id' => DepartmentMode::organizationRule(),
        ];
    }
}
