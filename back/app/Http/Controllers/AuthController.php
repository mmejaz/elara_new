<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(LoginRequest $request)
    {
        $payload = $this->authService->login($request->email, $request->password);

        $request->session()->regenerate();

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
}
