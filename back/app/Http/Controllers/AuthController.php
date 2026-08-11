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

    /**
     * Public endpoint to verify tenant exists. Called by frontend on app load.
     * Returns 200 if tenant is valid, 404 if not found.
     */
    public function verifyTenant(Request $request)
    {
        $tenant = tenant();

        if (!$tenant) {
            return ApiResponse::error(
                'Tenant not found',
                null,
                404,
            );
        }

        return ApiResponse::success([
            'id' => $tenant->id,
            'name' => $tenant->name,
        ], 'Tenant verified');
    }

    public function login(LoginRequest $request)
    {
        $payload = $this->authService->login($request->email, $request->password);

        // Only regenerate session if it's available (web routes, not API-only)
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return ApiResponse::success($payload, ResponseMessage::LOGIN_SUCCESS);
    }

    public function logout(Request $request)
    {
        $this->authService->logout();

        // Only invalidate session if it's available (web routes, not API-only)
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

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
