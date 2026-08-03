<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Tests\TenantTestCase;

/**
 * The security gate of the tenancy milestone: a session established under one
 * tenant must never be honored under another, even though the .lvh.me cookie is
 * sent to every tenant subdomain (stancl/tenancy#653).
 *
 * These run with a shared session store (single test database, no tenant DB
 * switching), which is precisely the worst case the guard defends against —
 * without EnsureUserBelongsToTenant the cross-tenant request below would return
 * 200, since the authenticated user is readable across the shared store. The
 * Origin header marks the request stateful so the session middleware runs.
 */
class TenantSessionIsolationTest extends TenantTestCase
{
    public function test_a_session_bound_to_another_tenant_is_rejected(): void
    {
        $this->makeTenant('beta', 'beta.lvh.me');

        $this->actingAs(User::factory()->create())
            ->withSession(['tenant_id' => 'acme'])
            ->withHeader('Origin', 'http://beta.lvh.me')
            ->getJson('http://beta.lvh.me/api/user')
            ->assertStatus(401);
    }

    public function test_a_session_bound_to_the_resolved_tenant_passes(): void
    {
        $this->makeTenant('beta', 'beta.lvh.me');

        $this->actingAs(User::factory()->create())
            ->withSession(['tenant_id' => 'beta'])
            ->withHeader('Origin', 'http://beta.lvh.me')
            ->getJson('http://beta.lvh.me/api/user')
            ->assertOk();
    }

    public function test_a_session_without_a_tenant_binding_is_not_blocked(): void
    {
        // e.g. the pre-login csrf-cookie request — no tenant_id set yet.
        $this->actingAs(User::factory()->create())
            ->withHeader('Origin', 'http://acme.lvh.me')
            ->getJson('http://acme.lvh.me/api/user')
            ->assertOk();
    }
}
