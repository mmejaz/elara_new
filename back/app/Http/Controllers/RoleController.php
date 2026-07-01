<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    public function __construct(private RoleService $roleService) {}

    public function index()
    {
        return ApiResponse::success($this->roleService->getAllNames(), ResponseMessage::FETCHED);
    }

    public function list()
    {
        return ApiResponse::success($this->roleService->getAll(), ResponseMessage::FETCHED);
    }

    public function store(StoreRoleRequest $request)
    {
        return ApiResponse::success(
            $this->roleService->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        return ApiResponse::success(
            $this->roleService->update($role, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }
}
