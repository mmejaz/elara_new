<?php

namespace App\Http\Controllers;

use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Services\PermissionService;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function __construct(private PermissionService $permissionService) {}

    public function index()
    {
        return response()->json(['data' => $this->permissionService->getAllNames()]);
    }

    public function list()
    {
        return response()->json(['data' => $this->permissionService->getAll()]);
    }

    public function store(StorePermissionRequest $request)
    {
        return response()->json(['data' => $this->permissionService->create($request->validated())], 201);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        return response()->json(['data' => $this->permissionService->update($permission, $request->validated())]);
    }
}
