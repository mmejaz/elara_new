<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Each tenant is served from its own subdomain, so the SPA origin varies
    // (acme.lvh.me, beta.lvh.me, …). A fixed origin cannot match them all — the
    // credentialed request is blocked and login fails. Match any tenant
    // subdomain via a pattern instead; `allowed_origins` stays available for an
    // explicit extra origin (a fixed FRONTEND_URL) if one is set.
    'allowed_origins' => array_filter([env('FRONTEND_URL')]),

    'allowed_origins_patterns' => [
        // http://<tenant>.lvh.me[:port] — the local wildcard dev domain.
        '#^https?://[a-z0-9-]+\.lvh\.me(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
