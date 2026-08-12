# Elara Backend Architecture Guide

A comprehensive guide to understanding, extending, and maintaining the Elara backend. This guide mirrors the quality and detail of the frontend guide.

## Table of Contents

1. [Overview & Tech Stack](#overview--tech-stack)
2. [Project Structure](#project-structure)
3. [Architecture Principles](#architecture-principles)
4. [Authentication & Authorization](#authentication--authorization)
5. [Multi-Tenancy](#multi-tenancy)
6. [Key Services](#key-services)
7. [Database & Seeding](#database--seeding)
8. [Module Generator](#module-generator)
9. [Common Tasks](#common-tasks)
10. [Testing Guide](#testing-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview & Tech Stack

Elara is a **multi-tenant SaaS admin dashboard** built with modern Laravel. It provides:
- **REST API** for frontend consumption (no GraphQL)
- **Multi-tenant architecture** with database isolation per tenant
- **Dynamic module generation** for rapid CRUD scaffolding
- **Role-Based Access Control (RBAC)** with granular permissions
- **Asynchronous job processing** for long-running operations

### Key Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | PHP | 8.4 | Server-side logic |
| **Framework** | Laravel | 13.8 | Web application framework |
| **Database** | MySQL | 8.0 | Central & tenant databases |
| **Authentication** | Sanctum | 4.0 | Stateless API auth (cookies) |
| **Authorization** | Spatie Permission | 8.1 | RBAC system |
| **Multi-tenancy** | Stancl Tenancy | 3.10 | Tenant isolation |
| **Queue** | Database | - | Background jobs |
| **Testing** | PHPUnit | 12.5 | Unit & feature tests |

---

## Project Structure

```
back/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # Request handlers (route logic)
│   │   ├── Middleware/         # Request/response interceptors
│   │   ├── Requests/           # Form validation + authorization
│   │   └── Resources/          # JSON response formatting (Data Transfer Objects)
│   ├── Models/                 # Eloquent ORM models
│   ├── Services/               # Business logic (separated from controllers)
│   │   ├── ModuleGeneratorService.php  # Creates full CRUD scaffolding
│   │   └── *Service.php        # Domain-specific business logic
│   ├── Jobs/                   # Queued background jobs
│   ├── Providers/              # Service provider registration
│   │   ├── TenancyServiceProvider.php  # Multi-tenancy setup
│   │   └── AppServiceProvider.php      # App-wide configuration
│   ├── Constants/              # Enums and constants
│   ├── Rules/                  # Custom validation rules
│   └── Helpers/                # Utility functions
├── routes/
│   ├── api.php                 # Main API routes (auth, profile)
│   ├── modules/                # Auto-loaded module routes (CRUD endpoints)
│   └── tenant.php              # Tenant-scoped routes (auto-initialized)
├── database/
│   ├── migrations/             # Schema changes (central & tenant)
│   ├── seeders/                # Data seeders (roles, permissions)
│   └── factories/              # Test data factories
├── tests/
│   ├── Feature/                # Integration tests (API endpoints)
│   ├── Unit/                   # Unit tests (services, models)
│   └── TestCase.php            # Test base class
├── bootstrap/
│   └── app.php                 # Application kernel (middleware, exception handling)
├── config/
│   ├── app.php                 # App configuration
│   ├── database.php            # Database connections
│   ├── auth.php                # Authentication config
│   ├── permission.php          # Spatie Permission config
│   └── tenancy.php             # Stancl Tenancy config
├── storage/                    # File uploads, logs, cache
├── composer.json               # PHP dependencies
├── .env.example                # Environment template
├── artisan                      # Artisan CLI entry point
└── phpunit.xml                 # Test configuration

```

### Key Directories

**`app/Services/`**
- Contains business logic separated from controllers
- Pure functions that don't depend on HTTP context
- Easy to test and reuse
- Example: `UserService::create()` handles user creation logic

**`app/Http/Requests/`**
- Organized by module (User/, Gender/, etc.)
- Validates incoming data before reaching controller
- Implements both validation rules AND authorization checks
- Automatically injected into controller methods

**`routes/modules/`**
- Auto-loaded by `bootstrap/app.php`
- Each module gets its own route file (GenderApi.php, UserApi.php)
- Follows RESTful conventions: GET, POST, PUT, DELETE
- Applies permission middleware automatically

**`database/migrations/`**
- Central migrations (users, roles, permissions, tenants)
- Tenant migrations (generated when tenant created)
- Use Laravel's migration system for version control
- Always reversible via `migrate:rollback`

---

## Architecture Principles

### 1. Controller → Service → Model Flow

Controllers handle HTTP concerns; services handle business logic.

```php
// ProductController.php
public function store(StoreProductRequest $request)
{
    // Form request validates + authorizes
    // Service performs business logic
    $product = $this->service->create($request->validated());

    return ApiResponse::success($product, 'Created', Response::HTTP_CREATED);
}

// ProductService.php
public function create(array $data): ProductResource
{
    return DB::transaction(function () use ($data) {
        $product = Product::create(['name' => $data['name']]);
        return new ProductResource($product);
    });
}
```

**Why this matters:**
- Controllers stay thin (5-10 lines per action)
- Services are testable without HTTP context
- Logic is reusable (CLI commands can use services too)
- Easier to refactor business logic independently

### 2. Two-Level Authorization

Authorization happens in two places:

```php
// 1. Route Middleware (first line of defense)
Route::post('/genders', 'store')->middleware('permission:gender.create');

// 2. Form Request (application-level check)
class StoreGenderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->can('create', Gender::class);
    }
}
```

**Why:**
- Route middleware is fast (blocks before controller execution)
- Form request authorization catches direct service calls (developers calling services without route)
- Defense in depth principle

### 3. Standardized API Response Envelope

All endpoints return a consistent structure:

```json
{
  "success": true,
  "message": "Genders retrieved successfully",
  "data": [...],
  "meta": { "current_page": 1, "per_page": 15, "total": 42 }
}
```

**Implementation:**

```php
// app/Helpers/ApiResponse.php
public static function paginated(LengthAwarePaginator $paginator, string $resourceClass, string $message)
{
    return response()->json([
        'success' => true,
        'message' => $message,
        'data' => $resourceClass::collection($paginator->items()),
        'meta' => [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ],
    ]);
}
```

**Why:**
- Frontend expects consistent structure
- Easy to handle errors uniformly
- API versioning is straightforward

### 4. Eloquent ORM with Database Transactions

All critical operations wrap in transactions:

```php
public function create(array $data): GenderResource
{
    return DB::transaction(function () use ($data) {
        $gender = Gender::create(['name' => $data['name']]);
        // Could add more logic here: audit log, send notification, etc.
        return new GenderResource($gender);
    });
}
```

**Why:**
- Atomic operations (all-or-nothing)
- Prevents data inconsistency
- Rollback on exception

---

## Authentication & Authorization

### Sanctum Cookie-Based Auth

Elara uses **cookies** for authentication (not tokens in localStorage):

```php
// Login flow
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Controller
public function login(LoginRequest $request)
{
    $user = User::where('email', $request->email)->first();
    
    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages(['email' => 'Invalid']);
    }

    $request->session()->regenerate();

    return ApiResponse::success(new UserResource($user), 'Logged in');
}
```

**Why cookies over tokens:**
- Immune to XSS token theft (httpOnly cookies)
- Automatic CSRF protection with Sanctum
- Browser handles cookie lifecycle automatically

### Permission Matrix

Permissions follow a naming convention: `{module}.{action}`

```
Permissions per module:
- gender.view     (read access)
- gender.create   (create records)
- gender.edit     (update records)
- gender.delete   (delete records)
- gender.export   (export data) [optional]

Roles inherit permissions:
- Super Admin: all permissions (via Gate::before bypass)
- Admin: module CRUD permissions
- Tenant Admin: module visibility only
- User: read-only on assigned modules
```

**Setup:**

```php
// app/Seeders/RolePermissionSeeder.php
public function run()
{
    $superAdmin = Role::findOrCreate('Super Admin');
    
    $admin = Role::findOrCreate('Admin');
    $admin->givePermissionTo('gender.view', 'gender.create', 'gender.edit', 'gender.delete');
    
    $permissions = Permission::get();
    $superAdmin->syncPermissions($permissions); // All permissions
}
```

**Usage in code:**

```php
// Check permission
auth()->user()->hasPermissionTo('gender.view')

// Gate facade
Gate::authorize('view', $model)

// Direct check
auth()->user()->can('create', Gender::class)
```

### Super Admin Bypass

Super Admin role bypasses all permission checks via `Gate::before`:

```php
// app/Providers/AppServiceProvider.php
Gate::before(function ($user) {
    return $user?->hasRole('Super Admin') ? true : null;
});
```

This means any gate/permission check returns `true` if user is Super Admin.

---

## Multi-Tenancy

### Tenant Architecture

Elara uses **database-per-tenant** isolation (Stancl Tenancy):

```
Central Database (elara_central)
├── users (all users across tenants)
├── tenants (tenant records)
├── domains (tenant domain mappings)
├── modules (available modules)
├── permissions & roles (global RBAC)
└── migrations

Tenant Databases (elara_tenant_school1, elara_tenant_school2, etc.)
├── users (tenant-scoped users)
├── genders (tenant-specific data)
├── [all other module tables]
└── migrations
```

### How Tenancy Works

1. Request comes in for `school1.elara.test`
2. Middleware identifies tenant ID from domain
3. `Tenancy::initialize($tenant)` sets active tenant
4. All queries run against tenant database
5. Tenant context automatically cleared after response

```php
// How to run code in tenant context
Tenancy::initialize($tenant)->run(function () {
    $users = User::all(); // Gets users from tenant database
});

// Automatic in requests (middleware handles it)
```

### Central vs Tenant Modules

```php
// Module scoped to all tenants (visible globally)
Module::where('scope', 'global')->get()

// Module scoped to specific tenant
Module::where('scope', 'tenant')->where('tenant_id', $tenantId)->get()
```

**Central modules** (defined in central DB):
- Available to all tenants
- Seed once, used everywhere
- Examples: Standard modules like Gender, City

**Tenant modules** (created by tenant admin):
- Private to that tenant
- Each tenant can customize their modules
- Examples: Custom business modules

### Tenant Provisioning

When creating a new tenant:

```php
// 1. Create tenant record (central DB)
$tenant = Tenant::create(['name' => 'School A']);

// 2. Create domain mapping (central DB)
Domain::create(['tenant_id' => $tenant->id, 'domain' => 'school-a.elara.test']);

// 3. Queue provisioning job (runs async)
ProvisionTenantJob::dispatch($tenant);

// In job:
Tenancy::initialize($tenant)->run(function () {
    // 4. Create tenant database & run migrations
    $this->artisan('migrate');
    
    // 5. Seed tenant-specific data
    $this->artisan('db:seed', ['class' => TenantDatabaseSeeder::class]);
});
```

### Session Isolation

```php
// .env
SESSION_DOMAIN=null  // Prevents cross-tenant cookie sharing
SESSION_SECURE_COOKIE=false  // Local dev; true in production
```

This ensures session cookies are scoped to subdomain (school1.elara.test vs school2.elara.test).

---

## Key Services

### ModuleGeneratorService

Generates complete CRUD scaffolding (9 files) for a new module:

```php
// 1. Generate full module
$generator = new ModuleGeneratorService();
$generator->generate($module);

// Files created:
// Backend (5): Model, Migration, Resource, Requests (Store/Update), Service, Controller, Routes
// Frontend (4): Slice, Queries, Page, Drawers (Add/Edit)
// Frontend wiring (2 files patched): store/index.ts, routes/index.tsx
// Permissions created automatically
// Admin role granted new permissions
```

**Error handling:**

```php
try {
    $generator->generate($module);
} catch (RuntimeException $e) {
    // Marker not found in wiring file
    $generator->rollback(); // Cleans up all created files
    throw $e;
}
```

### AuthService

Handles authentication logic:

```php
// Login
$service->login($email, $password, $rememberMe = false)

// Logout
$service->logout()

// Update profile
$service->updateProfile(User $user, array $data)

// Change password
$service->changePassword(User $user, string $oldPassword, string $newPassword)
```

### UserService

Manages user CRUD:

```php
$service->paginate($params)  // Paginated list with search/sort
$service->create($data)      // Create user with password
$service->update($user, $data)
$service->delete($user)
```

### RoleService

Manages roles and permissions:

```php
$service->create($name, $permissions)
$service->grantPermission($role, $permission)
$service->revokePermission($role, $permission)
```

---

## Database & Seeding

### Migrations

Central migrations (in central database):

```php
// database/migrations/2024_01_01_000000_create_users_table.php
public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->rememberToken();
        $table->timestamps();
    });
}
```

Tenant migrations (run per-tenant):

```php
// database/migrations/YYYY_MM_DD_HHMMSS_create_genders_table.php
// Same format, runs automatically when tenant created
```

### Seeders

**Central seeders** (run once):

```php
// app/Database/Seeders/RolePermissionSeeder.php
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create global roles
        Role::findOrCreate('Super Admin');
        Role::findOrCreate('Admin');
        Role::findOrCreate('User');

        // Create permissions from modules
        $this->artisan('db:seed', [
            'class' => PermissionSeeder::class,
        ]);
    }
}
```

**Tenant seeders** (run per-tenant on provision):

```php
// database/seeders/TenantDatabaseSeeder.php
class TenantDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user for tenant
        $admin = User::create([
            'name' => 'Tenant Admin',
            'email' => tenant('id') . '-admin@example.com',
            'password' => bcrypt('password'),
        ]);
        $admin->assignRole('Admin');

        // Sync permissions (created during provisioning)
    }
}
```

**Run seeders:**

```bash
# Central database
php artisan db:seed --class=RolePermissionSeeder

# All tenants
php artisan tenants:run db:seed
```

---

## Module Generator

### How It Works

```php
// 1. Create module record
$module = Module::create([
    'name' => 'Product',
    'type' => 'item',
    'resourceful' => true,
    'permissions' => ['view', 'create', 'edit', 'delete'],
]);

// 2. Trigger generation (API or command)
$generator = new ModuleGeneratorService();
$generator->generate($module);
```

### Generated Files

**Backend:**

```php
// app/Models/Product.php
class Product extends Model { }

// app/Http/Resources/ProductResource.php
class ProductResource extends JsonResource { }

// app/Http/Requests/Product/StoreProductRequest.php
class StoreProductRequest extends FormRequest { }

// app/Services/ProductService.php
class ProductService { /* paginate, create, update, delete */ }

// app/Http/Controllers/ProductController.php
class ProductController { /* index, store, update, destroy */ }

// routes/modules/ProductApi.php
// REST routes with permission middleware
```

**Frontend:**

```typescript
// src/modules/products/productsSlice.ts
// Redux state management

// src/modules/products/queries.ts
// TanStack Query hooks (useProducts, useCreateProduct, etc.)

// src/modules/products/pages/ProductsPage.tsx
// List page with pagination, search, sort

// src/modules/products/components/AddProductDrawer.tsx
// Add product form in drawer

// src/modules/products/components/EditProductDrawer.tsx
// Edit product form in drawer
```

### Frontend Wiring Patches

Generated code is injected via marker comments:

```typescript
// src/store/index.ts
// __MODULE_REDUCER_IMPORTS__
import productsReducer from '../modules/products/productsSlice'
// __MODULE_REDUCER_IMPORTS__

export const store = configureStore({
  reducer: {
    // __MODULE_REDUCERS__
    products: productsReducer,
    // __MODULE_REDUCERS__
  }
})

// src/routes/index.tsx
// __MODULE_ROUTE_DEFS__
const ProductsPage = lazy(() => import('../modules/products/pages/ProductsPage'))
const productsRoute = createRoute({ /* ... */ })
// __MODULE_ROUTE_DEFS__

export const adminRoutes = [
  // __MODULE_ROUTES__
  productsRoute,
  // __MODULE_ROUTES__
]
```

### Rollback Mechanism

If generation fails mid-way:

```php
try {
    $generator->generate($module);
} catch (\Exception $e) {
    // Automatically clean up
    $generator->rollback();
    
    // Cleanup includes:
    // 1. Delete all created files
    // 2. Restore patched files to original content
    // 3. Clear tracked state
}
```

---

## Common Tasks

### Create a New Resourceful Module

```bash
# Via API endpoint
POST /api/modules
{
  "name": "Product",
  "type": "item",
  "resourceful": true,
  "permissions": ["view", "create", "edit", "delete"]
}

# Module generated automatically (backend + frontend)
# Permissions created and granted to Admin role
# Frontend automatically wired into routes & store
```

### Add Permissions to a Role

```php
// Direct
$role->givePermissionTo('users.view', 'users.create');

// Via API
PUT /api/roles/{id}
{
  "permissions": ["users.view", "users.create", "users.edit"]
}
```

### Create a Tenant

```php
// Via API (Super Admin only)
POST /api/tenants
{
  "name": "School A",
  "domain": "school-a.elara.test",
  "admin_name": "Principal",
  "admin_email": "principal@schoola.edu",
  "admin_password": "SecurePassword123!"
}

// What happens:
// 1. Tenant record created in central DB
// 2. Domain mapping created
// 3. Async job queued to provision database & seed
// 4. Admin user created in tenant DB with Admin role
```

### Run Tests

```bash
# All tests
php artisan test

# Specific test file
php artisan test tests/Feature/GenderApiTest.php

# Specific test method
php artisan test --filter test_it_returns_a_paginated_envelope

# With coverage
php artisan test --coverage
```

### Debug Permission Issues

```bash
# Clear permission cache (permissions are cached)
php artisan permission:cache-reset

# Verify user permissions
php artisan tinker
> auth()->loginUsingId(1)
> auth()->user()->getAllPermissions()
> auth()->user()->hasPermissionTo('gender.view')

# Verify role permissions
> Role::findByName('Admin')->permissions
```

### Generate API Documentation

```bash
# Install scribe: composer require knuckleswtf/scribe
php artisan scribe:generate
```

---

## Testing Guide

### Test Structure

```
tests/
├── Feature/          # Integration tests (API endpoints)
│   ├── AuthFlowTest.php
│   ├── GenderApiTest.php
│   ├── TenantIsolationTest.php
│   └── ModuleGeneratorTest.php
├── Unit/             # Unit tests (services, models)
└── TestCase.php      # Base test class
```

### Running Tests

```bash
# All tests (fast - uses in-memory SQLite)
php artisan test

# Watch mode (re-run on file change)
php artisan test --watch

# Specific test file
php artisan test tests/Feature/GenderApiTest.php

# Specific test method
php artisan test --filter=test_guests_cannot_access_genders

# With coverage
php artisan test --coverage --coverage-html=coverage/
```

### Writing Tests

```php
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenderApiTest extends TestCase
{
    use RefreshDatabase; // Isolate test - fresh DB per test

    public function test_guests_cannot_access_genders()
    {
        $this->getJson('/api/genders')
            ->assertUnauthorized();
    }

    public function test_user_with_permission_can_access()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('gender.view');

        $this->actingAs($user)
            ->getJson('/api/genders')
            ->assertOk()
            ->assertJsonStructure(['data' => [], 'meta']);
    }
}
```

### Test Utilities

```php
// Login user
$this->actingAs($user)

// Make requests
$this->getJson('/api/endpoint')
$this->postJson('/api/endpoint', $data)
$this->putJson('/api/endpoint/{id}', $data)
$this->deleteJson('/api/endpoint/{id}')

// Assertions
->assertOk()           // 200
->assertCreated()      // 201
->assertUnauthorized() // 401
->assertForbidden()    // 403
->assertNotFound()     // 404
->assertUnprocessable()// 422
->assertJsonPath('data.id', 1)
->assertJsonValidationErrors('email')
```

---

## Deployment

### Environment Setup

Copy `.env.example` to `.env.production` and configure:

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
APP_URL=https://yourdomain.com

# Database
DB_HOST=your-db-host
DB_DATABASE=elara_production
DB_USERNAME=app_user
DB_PASSWORD=strong-random-password

# Session
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=.yourdomain.com

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,*.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Cache & Queue (use Redis for production)
CACHE_STORE=redis
QUEUE_CONNECTION=redis

# Email
MAIL_MAILER=smtp
MAIL_HOST=your-email-provider
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
```

### Deployment Checklist

- [ ] All tests passing locally
- [ ] Database migrations reviewed
- [ ] Secrets configured in CI/CD environment
- [ ] Database backup scheduled
- [ ] Rollback procedure documented and tested
- [ ] Load testing completed
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring/alerting set up

### Deployment Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Backup database
mysqldump elara_production > backup-$(date +%s).sql

# 4. Run migrations
php artisan migrate --force

# 5. Clear application cache
php artisan cache:clear
php artisan config:cache
php artisan route:cache

# 6. Restart queue workers
supervisorctl restart laravel-worker

# 7. Verify health
curl https://yourdomain.com/api/health
```

### Rollback Procedure

```bash
# If deployment fails:

# 1. Revert code
git revert <commit-hash>

# 2. Rollback migrations (keep backups!)
php artisan migrate:rollback --force

# 3. Restart services
supervisorctl restart laravel-worker
systemctl restart php-fpm

# 4. Verify health
curl https://yourdomain.com/api/health
```

---

## Troubleshooting

### "Marker not found" in Module Generator

**Error:** `RuntimeException: Marker not found in {path}: {marker}`

**Cause:** Frontend wiring file is missing marker comment

**Fix:**
```typescript
// Ensure these exist in src/store/index.ts
// __MODULE_REDUCER_IMPORTS__
// __MODULE_REDUCERS__

// Ensure these exist in src/routes/index.tsx
// __MODULE_ROUTE_DEFS__
// __MODULE_ROUTES__
```

### Permission checks failing unexpectedly

**Error:** User has permission but still gets `403 Forbidden`

**Cause:** Permission cache is stale

**Fix:**
```bash
php artisan permission:cache-reset
```

### Tenant users cannot login

**Error:** `401 Unauthorized` for tenant admin user

**Cause:** 
- Tenant database not provisioned
- Session domain mismatch
- Missing auth middleware on tenant route

**Debug:**
```bash
# Check tenant database exists
mysql -e "SHOW DATABASES LIKE '%tenant%'"

# Check user exists in tenant DB
Tenancy::initialize($tenant)->run(fn () => User::where('email', 'admin@example.com')->first())

# Verify session domain
echo SESSION_DOMAIN in .env
```

### Module generation fails mid-way

**Symptom:** Some files created, some missing, frontend wiring incomplete

**Cause:** Error during file creation or patching

**Fix:**
```php
// Manually trigger rollback
$generator = new ModuleGeneratorService();
$generator->rollback(); // Cleans everything up

// Try again
$generator->generate($module);
```

### Test database not resetting

**Symptom:** Tests fail because data persists between runs

**Fix:** Ensure test uses RefreshDatabase trait
```php
class MyTest extends TestCase
{
    use RefreshDatabase; // This is critical
}
```

### Queue jobs not processing

**Symptom:** Tenant provisioning jobs stuck in queue

**Fix:**
```bash
# Check queue
php artisan queue:work --verbose

# Clear failed jobs
php artisan queue:flush

# Check database driver config
php artisan queue:table  # Create jobs table if missing
php artisan migrate
```

---

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Spatie Permission Docs](https://spatie.be/docs/laravel-permission)
- [Stancl Tenancy Docs](https://docs.tenancyforlaravel.com)
- [Sanctum Docs](https://laravel.com/docs/sanctum)
- [Frontend Guide](../reactTheme/FRONTEND_GUIDE.md)

---

**Last Updated:** 2025-01-15  
**Maintained By:** Development Team  
**Questions?** Check the frontend guide or ask in #backend-questions Slack channel
