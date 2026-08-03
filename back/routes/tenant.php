<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| This app has no browser-facing web routes: the SPA is served by Vite and
| talks to the JSON API (routes/api.php + routes/modules/*.php), which is made
| tenant-aware on the `api` middleware group in bootstrap/app.php. The whole
| `web` group is likewise tenant-scoped there (so /sanctum/csrf-cookie resolves
| the tenant), which is why the stancl sample route was removed from here — it
| would double-apply the tenancy middleware and shadow routes/web.php.
|
| Register genuinely tenant-only web routes here if the need ever arises.
|
*/
