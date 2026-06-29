<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Services\UserService;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index()
    {
        return response()->json(['data' => $this->userService->getAll()]);
    }

    public function store(StoreUserRequest $request)
    {
        return response()->json(['data' => $this->userService->create($request->validated())], 201);
    }
}
