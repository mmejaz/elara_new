<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Services\ModuleGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests the Module Generator service: creates full CRUD scaffolding,
 * patches frontend wiring, handles rollback on failure, and ensures
 * permissions are created correctly.
 */
class ModuleGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private ModuleGeneratorService $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new ModuleGeneratorService();
        Role::findOrCreate('Super Admin', 'web');
        Role::findOrCreate('Admin', 'web');
    }

    // ────────────────────── File Creation ────

    public function test_generates_model_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Models/Product.php')
        ));

        $content = File::get(base_path('app/Models/Product.php'));
        $this->assertStringContainsString('class Product extends Model', $content);
        $this->assertStringContainsString('#[Fillable', $content);
    }

    public function test_generates_migration_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        // Migration files have timestamps, so we check for existence
        $migrations = File::glob(database_path('migrations/*_create_products_table.php'));
        $this->assertCount(1, $migrations, 'Migration file not found');

        $content = File::get($migrations[0]);
        $this->assertStringContainsString("Schema::create('products'", $content);
        $this->assertStringContainsString('$table->id()', $content);
        $this->assertStringContainsString("$table->string('name')", $content);
    }

    public function test_generates_resource_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Http/Resources/ProductResource.php')
        ));

        $content = File::get(base_path('app/Http/Resources/ProductResource.php'));
        $this->assertStringContainsString('class ProductResource extends JsonResource', $content);
    }

    public function test_generates_store_request(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Http/Requests/Product/StoreProductRequest.php')
        ));

        $content = File::get(base_path('app/Http/Requests/Product/StoreProductRequest.php'));
        $this->assertStringContainsString('class StoreProductRequest extends FormRequest', $content);
        $this->assertStringContainsString('can(\'create\', Product::class)', $content);
    }

    public function test_generates_update_request(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Http/Requests/Product/UpdateProductRequest.php')
        ));

        $content = File::get(base_path('app/Http/Requests/Product/UpdateProductRequest.php'));
        $this->assertStringContainsString('can(\'update\'', $content);
    }

    public function test_generates_service_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Services/ProductService.php')
        ));

        $content = File::get(base_path('app/Services/ProductService.php'));
        $this->assertStringContainsString('class ProductService', $content);
        $this->assertStringContainsString('public function paginate', $content);
        $this->assertStringContainsString('public function create', $content);
        $this->assertStringContainsString('public function update', $content);
        $this->assertStringContainsString('public function delete', $content);
    }

    public function test_generates_controller_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('app/Http/Controllers/ProductController.php')
        ));

        $content = File::get(base_path('app/Http/Controllers/ProductController.php'));
        $this->assertStringContainsString('class ProductController extends Controller', $content);
        $this->assertStringContainsString('public function index', $content);
        $this->assertStringContainsString('public function store', $content);
        $this->assertStringContainsString('public function update', $content);
        $this->assertStringContainsString('public function destroy', $content);
    }

    public function test_generates_route_file(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('routes/modules/ProductApi.php')
        ));

        $content = File::get(base_path('routes/modules/ProductApi.php'));
        $this->assertStringContainsString('Route::middleware(\'auth:sanctum\')', $content);
        $this->assertStringContainsString('get(\'/products\'', $content);
        $this->assertStringContainsString('permission:product.view', $content);
    }

    // ────────────────────── Frontend Files ────

    public function test_generates_frontend_slice(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('reactTheme/src/modules/products/productsSlice.ts')
        ));
    }

    public function test_generates_frontend_queries(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('reactTheme/src/modules/products/queries.ts')
        ));

        $content = File::get(base_path('reactTheme/src/modules/products/queries.ts'));
        $this->assertStringContainsString('useProducts', $content);
        $this->assertStringContainsString('useCreateProduct', $content);
        $this->assertStringContainsString('useUpdateProduct', $content);
        $this->assertStringContainsString('useDeleteProduct', $content);
    }

    public function test_generates_frontend_page(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('reactTheme/src/modules/products/pages/ProductsPage.tsx')
        ));
    }

    public function test_generates_frontend_drawers(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $this->assertTrue(File::exists(
            base_path('reactTheme/src/modules/products/components/AddProductDrawer.tsx')
        ));

        $this->assertTrue(File::exists(
            base_path('reactTheme/src/modules/products/components/EditProductDrawer.tsx')
        ));
    }

    // ───────────────── Frontend Wiring Patches ────

    public function test_patches_store_reducer_imports(): void
    {
        $storePath = base_path('reactTheme/src/store/index.ts');
        $originalContent = File::get($storePath);

        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $patchedContent = File::get($storePath);
        $this->assertStringContainsString("import productsReducer from '../modules/products/productsSlice'", $patchedContent);
        $this->assertNotEquals($originalContent, $patchedContent);
    }

    public function test_patches_store_reducer_registration(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $storeContent = File::get(base_path('reactTheme/src/store/index.ts'));
        $this->assertStringContainsString('products: productsReducer,', $storeContent);
    }

    public function test_patches_routes_module_defs(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $routesContent = File::get(base_path('reactTheme/src/routes/index.tsx'));
        $this->assertStringContainsString('const ProductsPage = lazy', $routesContent);
        $this->assertStringContainsString('productsRoute', $routesContent);
    }

    // ──────────────── Permission Creation ────

    public function test_creates_permissions_for_module(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
            'permissions' => ['view', 'create', 'edit', 'delete'],
        ]);

        $this->generator->generate($module);

        $this->assertDatabaseHas('permissions', ['name' => 'product.view']);
        $this->assertDatabaseHas('permissions', ['name' => 'product.create']);
        $this->assertDatabaseHas('permissions', ['name' => 'product.edit']);
        $this->assertDatabaseHas('permissions', ['name' => 'product.delete']);
    }

    public function test_grants_permissions_to_admin_role(): void
    {
        $adminRole = Role::findByName('Admin');
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
            'permissions' => ['view', 'create', 'edit'],
        ]);

        $this->generator->generate($module);

        $this->assertTrue($adminRole->hasPermissionTo('product.view'));
        $this->assertTrue($adminRole->hasPermissionTo('product.create'));
        $this->assertTrue($adminRole->hasPermissionTo('product.edit'));
    }

    // ──────────────────── Rollback ────

    public function test_rollback_deletes_created_files(): void
    {
        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);

        $modelPath = base_path('app/Models/Product.php');
        $this->assertTrue(File::exists($modelPath));

        $this->generator->rollback();

        $this->assertFalse(File::exists($modelPath));
    }

    public function test_rollback_restores_patched_files(): void
    {
        $storePath = base_path('reactTheme/src/store/index.ts');
        $originalContent = File::get($storePath);

        $module = Module::create([
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $this->generator->generate($module);
        $patchedContent = File::get($storePath);

        $this->generator->rollback();

        $restoredContent = File::get($storePath);
        $this->assertEquals($originalContent, $restoredContent);
    }

    // ──────────────── Error Handling ────

    public function test_duplicate_module_name_rejected(): void
    {
        Module::create(['name' => 'Product', 'type' => 'item', 'resourceful' => true]);

        $this->postJson('/api/modules', [
            'name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_invalid_module_type_rejected(): void
    {
        $this->postJson('/api/modules', [
            'name' => 'Product',
            'type' => 'invalid_type',
            'resourceful' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('type');
    }

    public function test_table_name_generated_correctly(): void
    {
        $module = Module::create([
            'name' => 'Product Category',
            'type' => 'item',
            'resourceful' => true,
        ]);

        $tableName = $this->generator->tableName();
        $this->assertEquals('product_categories', $tableName);
    }
}
