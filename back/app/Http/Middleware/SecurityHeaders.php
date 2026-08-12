<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds hardening response headers to every request. Cheap defense-in-depth for
 * the API (and any error page Laravel renders). Values are conservative so they
 * won't break the JSON API or the separate SPA origin.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = [
            // Never let the browser MIME-sniff a response into something executable.
            'X-Content-Type-Options' => 'nosniff',
            // This is a JSON API — it should never be framed. Blocks clickjacking.
            'X-Frame-Options' => 'DENY',
            // Don't leak full URLs (which may carry ids) to other origins.
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            // Turn off the legacy, deprecated XSS auditor (it can introduce bugs);
            // 0 is the current OWASP recommendation.
            'X-XSS-Protection' => '0',
            // Drop powerful browser features the API/app doesn't use.
            'Permissions-Policy' => 'geolocation=(), camera=(), microphone=(), payment=()',
        ];

        // HSTS only over HTTPS — sending it over plain HTTP is meaningless and
        // pinning localhost to HTTPS would break local development.
        if ($request->secure()) {
            $headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        // Don't advertise the stack. PHP injects X-Powered-By at the SAPI level
        // (expose_php), separate from Symfony's header bag, so it must be dropped
        // with header_remove() — removing it from $response->headers does nothing.
        // Belt-and-braces: also clear it from the bag. The permanent fix is
        // `expose_php = Off` in php.ini at the image/server level.
        if (! headers_sent()) {
            header_remove('X-Powered-By');
        }
        $response->headers->remove('X-Powered-By');

        return $response;
    }
}
