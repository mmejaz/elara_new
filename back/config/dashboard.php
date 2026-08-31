<?php

return [
    /*
    | Dashboard widgets that can be toggled per role in the Dashboard Setting
    | module. The KEY is a stable id the SPA maps to a component; the value is a
    | fallback English label (the frontend localizes via i18n).
    |
    | Add a widget: register its key here AND map it to a component in the SPA
    | (src/modules/dashboard/widgets.tsx) + add an i18n label.
    */
    'widgets' => [
        'revenue'            => 'Revenue',
        'orders'             => 'Orders',
        'customers'          => 'Customers',
        'conversion'         => 'Conversion',
        'monthly_revenue'    => 'Monthly Revenue',
        'recent_orders'      => 'Recent Orders',
        'traffic_by_channel' => 'Traffic by Channel',
    ],
];
