<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    // Tenant SPAs are served from a subdomain of the frontend host
    // (acme.localhost:5173), so the exact-match list above can't cover them.
    // FRONTEND_ORIGIN_PATTERN is a full regex delimited for preg_match.
    'allowed_origins_patterns' => [
        env('FRONTEND_ORIGIN_PATTERN', '#^http://([a-z0-9-]+\.)?localhost:5173$#'),
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
