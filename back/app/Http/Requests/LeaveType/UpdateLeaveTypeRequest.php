<?php

namespace App\Http\Requests\LeaveType;

use App\Models\LeaveType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $leaveType = $this->route('leaveType');
        return auth()->user()->can('update', $leaveType);
    }

    public function rules(): array
    {
        $id = $this->route('leaveType')->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:leave_types,name,' . $id],
        ];
    }
}
