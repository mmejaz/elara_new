<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Resolves the "root domain" a visitor is sent to when the host names a tenant
 * that does not exist (see the TenantCouldNotBeIdentifiedException renderer in
 * bootstrap/app.php).
 *
 * The value is config-driven rather than derived from the request host: stripping
 * the leftmost label off `dfasdfasdf.localhost` happens to give `localhost`, but
 * on a multi-label production host it would give a domain that is not the central
 * app at all.
 *
 * The target is the SPA origin, not the API origin — a lost visitor belongs on
 * the app, and the backend's own `/` is tenant-only. In production, where the SPA
 * is served by the app host, the two are the same origin anyway.
 */
final class CentralDomain
{
    public static function url(): string
    {
        return config('tenancy.central_url')
            ?? self::buildFrom((string) config('app.frontend_url'));
    }

    /**
     * The bare hostname, for clients that keep their own scheme and port and
     * swap only the host (see apiClient.ts / store/index.ts).
     */
    public static function host(): string
    {
        return (string) (parse_url(self::url(), PHP_URL_HOST) ?: self::firstCentralDomain());
    }

    /**
     * Takes the scheme and port from $reference (a FRONTEND_URL-style origin) and
     * puts the first configured central domain on them.
     */
    private static function buildFrom(string $reference): string
    {
        $parts = parse_url($reference) ?: [];

        $scheme = $parts['scheme'] ?? 'http';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return $scheme.'://'.self::firstCentralDomain().$port;
    }

    private static function firstCentralDomain(): string
    {
        $domains = (array) config('tenancy.central_domains');

        return (string) ($domains[0] ?? 'localhost');
    }
}
