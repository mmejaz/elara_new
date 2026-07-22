<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Resources\GlobalSettingRecordResource;
use App\Models\GlobalSetting;
use App\Models\GlobalSettingRecord;
use App\Services\GlobalSettingRecordService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class GlobalSettingRecordController extends Controller
{
    public function __construct(private GlobalSettingRecordService $service) {}

    public function index(Request $request, GlobalSetting $globalSetting)
    {
        return ApiResponse::paginated(
            $this->service->paginate($globalSetting, $request->only(['search', 'sort_dir', 'per_page'])),
            GlobalSettingRecordResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(Request $request, GlobalSetting $globalSetting)
    {
        return ApiResponse::success(
            $this->service->create($globalSetting, $this->validated($request, $globalSetting)),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(Request $request, GlobalSetting $globalSetting, GlobalSettingRecord $record)
    {
        abort_if($record->global_setting_id !== $globalSetting->id, 404);

        return ApiResponse::success(
            $this->service->update($record, $this->validated($request, $globalSetting)),
            ResponseMessage::UPDATED,
        );
    }

    /** Build validation rules dynamically from the app's field definitions. */
    private function validated(Request $request, GlobalSetting $globalSetting): array
    {
        $rules = [];
        $attributes = [];

        foreach ($globalSetting->fields as $field) {
            $key = 'data.' . $field->key;
            $rule = [$field->is_required ? 'required' : 'nullable'];

            if ($field->type === 'number') {
                $rule[] = 'numeric';
            } elseif ($field->type === 'boolean') {
                $rule[] = 'boolean';
            } elseif ($field->type === 'dropdown' && $field->options) {
                $rule[] = Rule::in($field->options);
            } else {
                $rule[] = 'string';
            }

            $rules[$key] = $rule;
            $attributes[$key] = $field->label;
        }

        $validated = Validator::make($request->all(), $rules, [], $attributes)->validate();

        return $validated['data'] ?? [];
    }
}
