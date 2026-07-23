<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Central-only modules
    |--------------------------------------------------------------------------
    |
    | Slugs that belong to the central app and must never appear inside a
    | tenant. Single source of truth, consumed in three places:
    |
    |   - ModuleSeeder skips them when seeding a tenant database.
    |   - A global scope on the Module model hides them from every query
    |     (including /modules/tree) once tenancy is initialized.
    |   - `modules:prune-central` strips them from already-provisioned tenants.
    |
    | "tenants"        — provisioning customers is the central app's job.
    | "module-builder" — the generator writes into config('modulegen.frontend_src'),
    |                    a frontend source tree SHARED by every tenant, so a
    |                    tenant using it would alter everyone else's app.
    |
    | Blocking the matching routes is handled separately by the `central`
    | middleware; hiding a menu item is not authorization on its own.
    |
    */

    'modules' => [
        'tenants',
        'module-builder',
    ],

];
