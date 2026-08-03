<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UpdateSettingsRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(LoginRequest $request)
    {
        $payload = $this->authService->login($request->email, $request->password);

        $request->session()->regenerate();

        // Bind the session to the tenant it was established under, so it cannot
        // be replayed against another tenant subdomain (see
        // EnsureUserBelongsToTenant + the shared .lvh.me cookie).
        $request->session()->put('tenant_id', tenant('id'));

        return ApiResponse::success($payload, ResponseMessage::LOGIN_SUCCESS);
    }

    public function logout(Request $request)
    {
        $this->authService->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, ResponseMessage::LOGOUT_SUCCESS);
    }

    public function me(Request $request)
    {
        return ApiResponse::success($this->authService->currentUser($request->user()));
    }

    public function updateAvatar(UpdateAvatarRequest $request)
    {
        return ApiResponse::success(
            $this->authService->updateAvatar($request->user(), $request->file('avatar')),
            ResponseMessage::UPDATED,
        );
    }

    public function deleteAvatar(Request $request)
    {
        return ApiResponse::success(
            $this->authService->deleteAvatar($request->user()),
            ResponseMessage::DELETED,
        );
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        return ApiResponse::success(
            $this->authService->updateProfile($request->user(), $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        return ApiResponse::success(
            $this->authService->updatePassword($request->user(), $request->validated('password')),
            ResponseMessage::UPDATED,
        );
    }

    public function updateSettings(UpdateSettingsRequest $request)
    {
        return ApiResponse::success(
            $this->authService->updateSettings($request->user(), $request->validated()),
            ResponseMessage::UPDATED,
        );
    }

    public function access(Request $request)
    {
        return ApiResponse::success(
            $this->authService->accessMatrix($request->user()),
            ResponseMessage::FETCHED,
        );
    }
}
