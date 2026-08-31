<?php

namespace App\Http\Controllers;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use App\Services\DashboardSettingService;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class DashboardSettingController extends Controller
{
    public function __construct(private DashboardSettingService $service) {}

    /** Super Admin: the full role × widget editing matrix. */
    public function index()
    {
        return ApiResponse::success($this->service->matrix(), ResponseMessage::FETCHED);
    }

    /** Super Admin: save one role's widget visibility. */
    public function update(Request $request, string $role)
    {
        $roleModel = Role::findOrFail($role);

        $keys = $this->service->widgetKeys();
        $validated = $request->validate([
            'config'   => ['required', 'array'],
            'config.*' => ['boolean'],
        ]);

        // Keep only known widget keys.
        $config = array_intersect_key($validated['config'], array_flip($keys));

        return ApiResponse::success(
            $this->service->saveRoleConfig($roleModel->id, $config),
            ResponseMessage::UPDATED,
        );
    }

    /** Any user: the widget keys their dashboard should render (union of roles). */
    public function myWidgets(Request $request)
    {
        return ApiResponse::success(
            ['widgets' => $this->service->visibleWidgetsDetailedFor($request->user())],
            ResponseMessage::FETCHED,
        );
    }

    /** Super Admin: add a new widget to the catalog. */
    public function storeWidget(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'key'   => ['nullable', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/', 'unique:dashboard_widgets,key'],
            'icon'  => ['nullable', 'string', 'max:40'],
        ]);

        $this->service->createWidget(
            $validated['label'],
            $validated['key'] ?? null,
            $validated['icon'] ?? null,
        );

        return ApiResponse::success($this->service->matrix(), ResponseMessage::CREATED);
    }

    /** Super Admin: update a widget (label, icon, or the master show/hide toggle). */
    public function updateWidget(Request $request, string $key)
    {
        $validated = $request->validate([
            'label'     => ['sometimes', 'string', 'max:100'],
            'icon'      => ['sometimes', 'nullable', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $this->service->updateWidget($key, $validated);

        return ApiResponse::success($this->service->matrix(), ResponseMessage::UPDATED);
    }

    /** Super Admin: remove a widget from the catalog. */
    public function destroyWidget(string $key)
    {
        $this->service->deleteWidget($key);

        return ApiResponse::success($this->service->matrix(), ResponseMessage::DELETED);
    }
}
