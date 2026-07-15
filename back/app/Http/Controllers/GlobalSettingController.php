<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\GlobalSetting\StoreGlobalSettingRequest;
use App\Http\Requests\GlobalSetting\UpdateGlobalSettingRequest;
use App\Http\Resources\GlobalSettingResource;
use App\Models\GlobalSetting;
use App\Services\GlobalSettingService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GlobalSettingController extends Controller
{
    public function __construct(private GlobalSettingService $service) {}

    public function index(Request $request)
    {
        return ApiResponse::paginated(
            $this->service->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            GlobalSettingResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function show(GlobalSetting $globalSetting)
    {
        return ApiResponse::success($this->service->show($globalSetting), ResponseMessage::FETCHED);
    }

    public function store(StoreGlobalSettingRequest $request)
    {
        return ApiResponse::success(
            $this->service->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateGlobalSettingRequest $request, GlobalSetting $globalSetting)
    {
        return ApiResponse::success(
            $this->service->update($globalSetting, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(GlobalSetting $globalSetting)
    {
        $this->service->delete($globalSetting);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
