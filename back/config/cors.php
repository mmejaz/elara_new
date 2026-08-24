<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    // Tenant SPAs are served from a subdomain of the frontend host
    // (acme.localhost:5173), so the exact-match list above can't cover them.
    // FRONTEND_ORIGIN_PATTERN is a full regex delimited for preg_match.
    'allowed_origins_patterns' => [
        env('FRONTEND_ORIGIN_PATTERN', '#^http://([a-z0-9-]+\.)?localhost:5173$#'),
        // The central app is served on the loopback IP (127.0.0.1:5173).
        '#^http://127\.0\.0\.1:5173$#',
        // Cypress running inside a container reaches the host-published SPA via
        // host.docker.internal (macOS has no --network host). Test-only origin.
        '#^http://host\.docker\.internal:5173$#',
    ],

    'allowed_headers' => ['Accept', 'Accept-Language', 'Content-Type', 'X-CSRF-TOKEN', 'X-XSRF-TOKEN', 'Authorization', 'X-Requested-With'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 3600,

    'supports_credentials' => true,

];
