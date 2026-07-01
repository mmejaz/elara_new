<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Models\Module;
use App\Services\ModuleService;
use Symfony\Component\HttpFoundation\Response;

class ModuleController extends Controller
{
    public function __construct(private ModuleService $moduleService) {}

    public function index()
    {
        return ApiResponse::success($this->moduleService->getAll(), ResponseMessage::FETCHED);
    }

    public function tree()
    {
        return ApiResponse::success($this->moduleService->tree(), ResponseMessage::FETCHED);
    }

    public function store(StoreModuleRequest $request)
    {
        return ApiResponse::success(
            $this->moduleService->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateModuleRequest $request, Module $module)
    {
        return ApiResponse::success(
            $this->moduleService->update($module, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }
}
