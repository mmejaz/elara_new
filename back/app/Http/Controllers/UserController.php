<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index()
    {
        return ApiResponse::success($this->userService->getAll(), ResponseMessage::FETCHED);
    }

    public function store(StoreUserRequest $request)
    {
        return ApiResponse::success(
            $this->userService->create($request->validated()),
            ResponseMessage::CREATED,
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        return ApiResponse::success(
            $this->userService->update($user, $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function destroy(User $user)
    {
        $this->userService->delete($user);

        return ApiResponse::success(null, ResponseMessage::DELETED);
    }
}
