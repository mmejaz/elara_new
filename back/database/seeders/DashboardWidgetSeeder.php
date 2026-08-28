<?php

namespace Database\Seeders;

use App\Models\DashboardWidget;
use Illuminate\Database\Seeder;

class DashboardWidgetSeeder extends Seeder
{
    /**
     * The built-in dashboard widgets. Each maps to a component the SPA already
     * renders. Custom widgets added via the UI live in the same table but have
     * no dedicated component (they render a generic placeholder card).
     *
     * icon is a short token the SPA maps to an Ant Design icon.
     */
    private array $widgets = [
        ['key' => 'revenue',            'label' => 'Revenue',            'icon' => 'dollar'],
        ['key' => 'orders',             'label' => 'Orders',             'icon' => 'cart'],
        ['key' => 'customers',          'label' => 'Customers',          'icon' => 'team'],
        ['key' => 'conversion',         'label' => 'Conversion',         'icon' => 'percent'],
        ['key' => 'monthly_revenue',    'label' => 'Monthly Revenue',    'icon' => 'line'],
        ['key' => 'recent_orders',      'label' => 'Recent Orders',      'icon' => 'list'],
        ['key' => 'traffic_by_channel', 'label' => 'Traffic by Channel', 'icon' => 'pie'],
    ];

    public function run(): void
    {
        foreach ($this->widgets as $i => $w) {
            DashboardWidget::updateOrCreate(
                ['key' => $w['key']],
                [
                    'label'      => $w['label'],
                    'icon'       => $w['icon'],
                    'sort_order' => $i,
                    // Don't clobber an admin's is_active toggle on re-seed.
                ] + (DashboardWidget::where('key', $w['key'])->exists() ? [] : ['is_active' => true]),
            );
        }
    }
}
