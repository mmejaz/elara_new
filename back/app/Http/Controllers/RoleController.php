<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(private RoleService $roleService) {}

    public function index()
    {
        return response()->json(['data' => $this->roleService->getAllNames()]);
    }

    public function list()
    {
        return response()->json(['data' => $this->roleService->getAll()]);
    }

    public function store(StoreRoleRequest $request)
    {
        return response()->json(['data' => $this->roleService->create($request->validated())], 201);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        return response()->json(['data' => $this->roleService->update($role, $request->validated())]);
    }
}
