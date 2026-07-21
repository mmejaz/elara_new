<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Symfony\Component\HttpFoundation\Response;

class PermissionController extends Controller
{
    public function __construct(private PermissionService $permissionService) {}

    public function index()
    {
        return ApiResponse::success($this->permissionService->getAllNames(), ResponseMessage::FETCHED);
    }

    public function paginated(Request $request)
    {
        return ApiResponse::paginated(
            $this->permissionService->paginate($request->only(['search', 'sort_by', 'sort_dir', 'per_page'])),
            PermissionResource::class,
            ResponseMessage::FETCHED,
        );
    }

    public function store(StorePermissionRequest $request)
    {
        return ApiResponse::success(
            $this->permissionService->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        return ApiResponse::success(
            $this->permissionService->update($permission, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }
}
