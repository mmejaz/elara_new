<?php

namespace App\Http\Requests\GlobalSetting;

use App\Models\GlobalSetting;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGlobalSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $globalSetting = $this->route('globalSetting');
        return auth()->user()->can('update', $globalSetting);
    }

    public function rules(): array
    {
        $id = $this->route('globalSetting')->id;

        return [
            'name'                => ['required', 'string', 'max:255', 'unique:global_settings,name,' . $id],
            'fields'              => ['array'],
            'fields.*.id'         => ['nullable', 'integer'],
            'fields.*.label'      => ['required', 'string', 'max:255'],
            'fields.*.type'       => ['required', 'string', 'in:text,number,password,textarea,dropdown,boolean,date,image'],
            'fields.*.options'    => ['array'],
            'fields.*.options.*'  => ['string', 'max:255'],
            'fields.*.is_required' => ['boolean'],
        ];
    }
}
