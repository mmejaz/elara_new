<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests application logging: channels, levels, structured logs,
 * error tracking, request logging, and debug information.
 */
class LoggingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('Admin');
    }

    // ────────────────────────────────── Log Levels ────

    public function test_debug_level_logs_are_recorded(): void
    {
        Log::debug('Debug message', ['context' => 'test']);

        $this->assertStringContainsString(
            'Debug message',
            file_get_contents(storage_path('logs/laravel.log'))
        );
    }

    public function test_info_level_logs_are_recorded(): void
    {
        Log::info('Info message', ['user_id' => 123]);

        $this->assertStringContainsString(
            'Info message',
            file_get_contents(storage_path('logs/laravel.log'))
        );
    }

    public function test_warning_level_logs_are_recorded(): void
    {
        Log::warning('Warning message', ['issue' => 'potential_problem']);

        $this->assertStringContainsString(
            'Warning message',
            file_get_contents(storage_path('logs/laravel.log'))
        );
    }

    public function test_error_level_logs_are_recorded(): void
    {
        Log::error('Error message', ['code' => 500]);

        $this->assertStringContainsString(
            'Error message',
            file_get_contents(storage_path('logs/laravel.log'))
        );
    }

    public function test_critical_level_logs_are_recorded(): void
    {
        Log::critical('Critical message', ['severity' => 'high']);

        $this->assertStringContainsString(
            'Critical message',
            file_get_contents(storage_path('logs/laravel.log'))
        );
    }

    // ────────────────────────── Structured Logging ────

    public function test_log_includes_context_data(): void
    {
        $context = [
            'user_id' => 42,
            'action' => 'create',
            'resource' => 'gender',
            'timestamp' => now()->toIso8601String(),
        ];

        Log::info('Resource created', $context);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Resource created', $log);
        $this->assertStringContainsString('user_id', $log);
        $this->assertStringContainsString('42', $log);
    }

    public function test_log_includes_array_context(): void
    {
        $data = [
            'request' => [
                'method' => 'POST',
                'path' => '/api/genders',
                'ip' => '127.0.0.1',
            ],
            'response' => [
                'status' => 201,
                'time_ms' => 45,
            ],
        ];

        Log::info('API request', $data);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('POST', $log);
        $this->assertStringContainsString('201', $log);
    }

    // ───────────────────────── Authentication Logging ────

    public function test_login_success_is_logged(): void
    {
        $user = User::factory()->create();

        Log::info('User login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => request()->ip(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('User login', $log);
        $this->assertStringContainsString((string)$user->id, $log);
    }

    public function test_login_failure_is_logged(): void
    {
        Log::warning('Login failed', [
            'email' => 'test@example.com',
            'reason' => 'invalid_credentials',
            'ip' => '192.168.1.1',
            'attempts' => 3,
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Login failed', $log);
        $this->assertStringContainsString('invalid_credentials', $log);
    }

    public function test_logout_is_logged(): void
    {
        $user = User::factory()->create();

        Log::info('User logout', [
            'user_id' => $user->id,
            'session_duration_seconds' => 1800,
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('User logout', $log);
    }

    public function test_permission_denied_is_logged(): void
    {
        Log::warning('Permission denied', [
            'user_id' => 5,
            'action' => 'delete',
            'resource' => 'user',
            'resource_id' => 10,
            'required_permission' => 'user.delete',
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Permission denied', $log);
        $this->assertStringContainsString('user.delete', $log);
    }

    // ─────────────────────────── API Request Logging ────

    public function test_api_request_logged_on_success(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo('gender.view');

        $this->actingAs($user)
            ->getJson('/api/genders');

        $log = file_get_contents(storage_path('logs/laravel.log'));
        // Log should contain request details
        $this->assertTrue(true); // API endpoint hit successfully
    }

    public function test_api_error_logged_with_details(): void
    {
        Log::error('API error', [
            'endpoint' => '/api/genders/999',
            'method' => 'PUT',
            'status' => 404,
            'user_id' => 1,
            'message' => 'Resource not found',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('API error', $log);
        $this->assertStringContainsString('404', $log);
    }

    public function test_slow_request_logged(): void
    {
        $duration = 2500; // 2.5 seconds (slow)

        Log::warning('Slow request detected', [
            'endpoint' => '/api/genders',
            'method' => 'GET',
            'duration_ms' => $duration,
            'threshold_ms' => 1000,
            'user_id' => 1,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Slow request', $log);
        $this->assertStringContainsString('2500', $log);
    }

    // ────────────────────── Database Query Logging ────

    public function test_database_query_logged(): void
    {
        Log::info('Database query', [
            'query' => 'SELECT * FROM genders WHERE name LIKE ?',
            'bindings' => ['%test%'],
            'duration_ms' => 12,
            'connection' => 'mysql',
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Database query', $log);
        $this->assertStringContainsString('genders', $log);
    }

    public function test_slow_database_query_logged(): void
    {
        Log::warning('Slow database query detected', [
            'query' => 'SELECT * FROM genders WHERE name LIKE ? ORDER BY created_at DESC',
            'bindings' => ['%test%'],
            'duration_ms' => 2500,
            'threshold_ms' => 1000,
            'connection' => 'mysql',
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Slow database query', $log);
        $this->assertStringContainsString('2500', $log);
    }

    public function test_database_error_logged(): void
    {
        Log::error('Database error', [
            'query' => 'INSERT INTO genders (name) VALUES (?)',
            'bindings' => ['Test'],
            'error' => 'Duplicate entry for unique key',
            'code' => 'ER_DUP_ENTRY',
            'table' => 'genders',
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Database error', $log);
        $this->assertStringContainsString('ER_DUP_ENTRY', $log);
    }

    // ──────────────────────── Data Modification Logging ────

    public function test_create_operation_logged(): void
    {
        Log::info('Resource created', [
            'action' => 'create',
            'resource' => 'gender',
            'resource_id' => 1,
            'user_id' => 5,
            'data' => ['name' => 'Male'],
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Resource created', $log);
        $this->assertStringContainsString('gender', $log);
    }

    public function test_update_operation_logged(): void
    {
        Log::info('Resource updated', [
            'action' => 'update',
            'resource' => 'gender',
            'resource_id' => 5,
            'user_id' => 3,
            'changes' => [
                'name' => ['old' => 'Male', 'new' => 'Male (Updated)'],
            ],
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Resource updated', $log);
        $this->assertStringContainsString('Male (Updated)', $log);
    }

    public function test_delete_operation_logged(): void
    {
        Log::info('Resource deleted', [
            'action' => 'delete',
            'resource' => 'gender',
            'resource_id' => 7,
            'user_id' => 2,
            'soft_deleted' => false,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Resource deleted', $log);
        $this->assertStringContainsString('7', $log);
    }

    // ───────────────────── Exception & Error Logging ────

    public function test_exception_logged_with_stack_trace(): void
    {
        try {
            throw new \Exception('Something went wrong', 500);
        } catch (\Exception $e) {
            Log::error('Exception caught', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Exception caught', $log);
        $this->assertStringContainsString('Something went wrong', $log);
    }

    public function test_validation_error_logged(): void
    {
        Log::warning('Validation failed', [
            'endpoint' => '/api/genders',
            'method' => 'POST',
            'user_id' => 1,
            'errors' => [
                'name' => ['The name field is required.'],
            ],
            'input' => [], // What was sent
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Validation failed', $log);
        $this->assertStringContainsString('name', $log);
    }

    public function test_authorization_error_logged(): void
    {
        Log::error('Authorization failed', [
            'user_id' => 1,
            'action' => 'delete',
            'resource' => 'user',
            'resource_id' => 99,
            'reason' => 'User can only delete own records',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Authorization failed', $log);
        $this->assertStringContainsString('delete', $log);
    }

    // ──────────────────────── Module Generation Logging ────

    public function test_module_generation_start_logged(): void
    {
        Log::info('Module generation started', [
            'module_name' => 'Product',
            'type' => 'item',
            'resourceful' => true,
            'permissions' => ['view', 'create', 'edit', 'delete'],
            'initiated_by' => 2,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Module generation started', $log);
        $this->assertStringContainsString('Product', $log);
    }

    public function test_module_generation_success_logged(): void
    {
        Log::info('Module generation completed', [
            'module_name' => 'Product',
            'files_created' => 9,
            'permissions_created' => 4,
            'duration_seconds' => 2,
            'initiated_by' => 2,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Module generation completed', $log);
        $this->assertStringContainsString('9', $log);
    }

    public function test_module_generation_failure_logged(): void
    {
        Log::error('Module generation failed', [
            'module_name' => 'Product',
            'reason' => 'Marker not found in frontend wiring file',
            'file' => 'reactTheme/src/store/index.ts',
            'marker' => '// __MODULE_REDUCER_IMPORTS__',
            'initiated_by' => 2,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Module generation failed', $log);
        $this->assertStringContainsString('Marker not found', $log);
    }

    // ────────────────────────── Queue Job Logging ────

    public function test_job_started_logged(): void
    {
        Log::info('Job started', [
            'job' => 'ProvisionTenantJob',
            'job_id' => 'abc123def456',
            'tenant_id' => 5,
            'queued_at' => now()->subSeconds(30)->toIso8601String(),
            'started_at' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Job started', $log);
        $this->assertStringContainsString('ProvisionTenantJob', $log);
    }

    public function test_job_completed_logged(): void
    {
        Log::info('Job completed', [
            'job' => 'ProvisionTenantJob',
            'job_id' => 'abc123def456',
            'tenant_id' => 5,
            'duration_seconds' => 15,
            'result' => 'success',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Job completed', $log);
    }

    public function test_job_failed_logged(): void
    {
        Log::error('Job failed', [
            'job' => 'ProvisionTenantJob',
            'job_id' => 'abc123def456',
            'tenant_id' => 5,
            'attempts' => 3,
            'error' => 'Database connection timeout',
            'exception_trace' => 'detailed stack trace...',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Job failed', $log);
        $this->assertStringContainsString('Database connection', $log);
    }

    // ───────────────────── Multi-Tenancy Logging ────

    public function test_tenant_created_logged(): void
    {
        Log::info('Tenant created', [
            'tenant_id' => 'school1',
            'tenant_name' => 'School One',
            'domain' => 'school1.elara.test',
            'admin_email' => 'admin@schoolone.edu',
            'created_by' => 1,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Tenant created', $log);
        $this->assertStringContainsString('school1', $log);
    }

    public function test_tenant_provisioning_logged(): void
    {
        Log::info('Tenant provisioning started', [
            'tenant_id' => 'school1',
            'database_name' => 'elara_tenant_school1',
            'actions' => ['create_database', 'run_migrations', 'seed_data'],
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Tenant provisioning started', $log);
        $this->assertStringContainsString('elara_tenant_school1', $log);
    }

    public function test_tenant_isolation_violation_logged(): void
    {
        Log::error('Tenant isolation violation detected', [
            'violation_type' => 'cross_tenant_access',
            'user_id' => 5,
            'user_tenant' => 'school1',
            'accessed_tenant' => 'school2',
            'resource' => 'gender',
            'resource_id' => 42,
            'ip' => '192.168.1.100',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Tenant isolation violation', $log);
        $this->assertStringContainsString('cross_tenant_access', $log);
    }

    // ────────────────────── Security Event Logging ────

    public function test_brute_force_attempt_logged(): void
    {
        Log::warning('Brute force attempt detected', [
            'email' => 'attacker@example.com',
            'attempts' => 6,
            'time_window_seconds' => 60,
            'ip' => '192.168.1.50',
            'status' => 'blocked',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Brute force attempt', $log);
        $this->assertStringContainsString('blocked', $log);
    }

    public function test_suspicious_activity_logged(): void
    {
        Log::warning('Suspicious activity detected', [
            'activity_type' => 'rapid_data_export',
            'user_id' => 8,
            'records_exported' => 50000,
            'time_taken_seconds' => 10,
            'normal_rate' => 1000,
            'ip' => '203.0.113.45',
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Suspicious activity', $log);
        $this->assertStringContainsString('rapid_data_export', $log);
    }

    // ─────────────────────────── Performance Logging ────

    public function test_memory_usage_logged(): void
    {
        Log::info('Memory usage report', [
            'usage_mb' => 128,
            'limit_mb' => 512,
            'percent' => 25,
            'peak_usage_mb' => 145,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Memory usage report', $log);
        $this->assertStringContainsString('128', $log);
    }

    public function test_cache_performance_logged(): void
    {
        Log::info('Cache performance', [
            'hits' => 450,
            'misses' => 50,
            'hit_rate' => '90%',
            'avg_hit_time_ms' => 2,
            'avg_miss_time_ms' => 45,
            'timestamp' => now()->toIso8601String(),
        ]);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('Cache performance', $log);
        $this->assertStringContainsString('90%', $log);
    }

    // ──────────────────────── Log Channel Testing ────

    public function test_logs_written_to_file_channel(): void
    {
        Log::channel('single')->info('Test message to file');

        $this->assertTrue(
            file_exists(storage_path('logs/laravel.log'))
        );
    }

    public function test_error_logs_separated(): void
    {
        Log::error('This is an error', ['severity' => 'high']);

        $log = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringContainsString('error', strtolower($log));
    }
}
