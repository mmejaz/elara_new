<?php

namespace App\Services;

use App\Models\DashboardWidget;
use App\Models\RoleDashboardWidget;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DashboardSettingService
{
    /**
     * Every widget, ordered — active AND inactive. Used by the Super Admin
     * editing matrix so a hidden widget can be turned back on. Falls back to the
     * config catalog when the table has not been seeded yet.
     *
     * @return Collection<int, DashboardWidget>
     */
    public function allWidgets(): Collection
    {
        $rows = DashboardWidget::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($rows->isNotEmpty()) {
            return $rows;
        }

        return collect(config('dashboard.widgets', []))
            ->map(fn ($label, $key) => new DashboardWidget([
                'key' => $key, 'label' => $label, 'icon' => null, 'is_active' => true, 'sort_order' => 0,
            ]))
            ->values();
    }

    /** Only widgets that are shown on the dashboard (the master toggle is on). */
    public function activeWidgets(): Collection
    {
        return $this->allWidgets()->filter(fn (DashboardWidget $w) => $w->is_active)->values();
    }

    /** All widget keys (active + inactive) — role config is stored for every widget. */
    public function widgetKeys(): array
    {
        return $this->allWidgets()->pluck('key')->all();
    }

    /**
     * The full editing matrix: the widget catalog (incl. hidden widgets) + every
     * role with its current per-widget visibility (unset = visible by default).
     */
    public function matrix(): array
    {
        $widgets = $this->allWidgets();
        $keys = $widgets->pluck('key')->all();

        $stored = RoleDashboardWidget::query()->get()->groupBy('role_id');

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(function (Role $role) use ($keys, $stored) {
                $byKey = ($stored[$role->id] ?? collect())->keyBy('widget_key');

                $config = [];
                foreach ($keys as $key) {
                    $config[$key] = $byKey->has($key) ? (bool) $byKey[$key]->is_visible : true;
                }

                return ['id' => $role->id, 'name' => $role->name, 'config' => $config];
            })
            ->values();

        $widgetsOut = $widgets
            ->map(fn (DashboardWidget $w) => [
                'key' => $w->key, 'label' => $w->label, 'icon' => $w->icon, 'is_active' => (bool) $w->is_active,
            ])
            ->values();

        return ['widgets' => $widgetsOut, 'roles' => $roles];
    }

    /** Update an existing widget's label, icon, and/or master show toggle. */
    public function updateWidget(string $key, array $data): DashboardWidget
    {
        $widget = DashboardWidget::where('key', $key)->firstOrFail();
        $widget->fill(array_intersect_key($data, array_flip(['label', 'icon', 'is_active'])));
        $widget->save();

        return $widget;
    }

    /** Create a widget. Derives a unique snake_case key from the label if none given. */
    public function createWidget(string $label, ?string $key = null, ?string $icon = null): DashboardWidget
    {
        $key = $this->uniqueKey($key ?: Str::snake(Str::slug($label, '_')));

        return DashboardWidget::create([
            'key'        => $key,
            'label'      => $label,
            'icon'       => $icon,
            'is_active'  => true,
            'sort_order' => (int) (DashboardWidget::max('sort_order') ?? 0) + 1,
        ]);
    }

    /** Delete a widget and any per-role visibility rows referencing it. */
    public function deleteWidget(string $key): void
    {
        DB::transaction(function () use ($key) {
            DashboardWidget::where('key', $key)->delete();
            RoleDashboardWidget::where('widget_key', $key)->delete();
        });
    }

    private function uniqueKey(string $base): string
    {
        $base = trim($base, '_') ?: 'widget';
        $key = $base;
        $i = 2;
        while (DashboardWidget::where('key', $key)->exists()) {
            $key = $base.'_'.$i++;
        }

        return $key;
    }

    /** Persist a role's widget visibility. $config is [widgetKey => bool]. */
    public function saveRoleConfig(int $roleId, array $config): array
    {
        DB::transaction(function () use ($roleId, $config) {
            foreach ($this->widgetKeys() as $key) {
                RoleDashboardWidget::updateOrCreate(
                    ['role_id' => $roleId, 'widget_key' => $key],
                    ['is_visible' => (bool) ($config[$key] ?? true)],
                );
            }
        });

        return $this->matrix();
    }

    /**
     * The visible widgets for a user as detail objects (key/label/icon), in
     * catalog order — what the dashboard actually renders.
     */
    public function visibleWidgetsDetailedFor(User $user): array
    {
        $visible = array_flip($this->visibleWidgetsFor($user));

        return $this->activeWidgets()
            ->filter(fn (DashboardWidget $w) => isset($visible[$w->key]))
            ->map(fn (DashboardWidget $w) => ['key' => $w->key, 'label' => $w->label, 'icon' => $w->icon])
            ->values()
            ->all();
    }

    /**
     * The widget keys visible to a user: the UNION across their roles. A widget
     * is hidden only when EVERY one of the user's roles explicitly hides it;
     * unconfigured roles default to visible. This applies to every role — Super
     * Admin included: unconfigured widgets stay visible (so the default dashboard
     * is full), but a widget explicitly hidden for the Super Admin role is
     * honored on the Super Admin dashboard.
     */
    public function visibleWidgetsFor(User $user): array
    {
        // Only widgets whose master toggle is on can appear on any dashboard.
        $keys = $this->activeWidgets()->pluck('key')->all();

        $roleIds = $user->roles->pluck('id');
        if ($roleIds->isEmpty()) {
            return $keys; // no roles → show the default (all) rather than a blank dashboard
        }

        // [role_id][widget_key] => is_visible for this user's roles only.
        $map = RoleDashboardWidget::query()
            ->whereIn('role_id', $roleIds)
            ->get()
            ->groupBy('role_id')
            ->map(fn ($rows) => $rows->keyBy('widget_key'));

        return array_values(array_filter($keys, function (string $key) use ($roleIds, $map) {
            // Visible if ANY role shows it (unconfigured role = visible).
            return $roleIds->contains(function ($rid) use ($key, $map) {
                $row = $map[$rid][$key] ?? null;
                return $row === null || (bool) $row->is_visible;
            });
        }));
    }
}
