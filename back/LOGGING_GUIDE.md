# Elara Logging Guide

Best practices for logging in the Elara application. Comprehensive logging enables debugging, monitoring, security auditing, and performance analysis.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Log Levels](#log-levels)
3. [Structured Logging](#structured-logging)
4. [Common Scenarios](#common-scenarios)
5. [Channels & Configuration](#channels--configuration)
6. [Best Practices](#best-practices)
7. [Log Queries](#log-queries)
8. [Testing Logs](#testing-logs)

---

## Quick Start

### Basic Logging

```php
use Illuminate\Support\Facades\Log;

// Simple message
Log::info('User logged in');

// Message with context
Log::info('User logged in', ['user_id' => 42, 'email' => 'user@example.com']);

// Different levels
Log::debug('Debug info');      // Development details
Log::info('Information');      // General info
Log::notice('Notice');         // Important info
Log::warning('Warning');       // Warning situation
Log::error('Error');           // Error occurred
Log::critical('Critical');     // Critical error
Log::alert('Alert');           // Alert/action needed
Log::emergency('Emergency');   // System unusable
```

### Where Logs Go

```bash
# Default location
storage/logs/laravel.log

# View recent logs
tail -f storage/logs/laravel.log

# Search logs
grep "Error" storage/logs/laravel.log

# Count occurrences
grep -c "warning" storage/logs/laravel.log
```

---

## Log Levels

### DEBUG (Lowest)
Development-focused information. Verbose, used during debugging.

```php
Log::debug('Query executed', [
    'query' => 'SELECT * FROM users',
    'duration_ms' => 12,
]);

// When to use:
// - Development environment
// - Detailed variable dumps
// - Trace execution flow
// - NOT in production by default (too verbose)
```

### INFO
General information about application events.

```php
Log::info('Resource created', [
    'resource' => 'gender',
    'resource_id' => 1,
    'user_id' => 5,
]);

// When to use:
// - Application milestones
// - State changes (user created, module deployed)
// - Audit trail of actions
// - Normal operation events
```

### NOTICE
Normal but significant events. More important than INFO.

```php
Log::notice('Configuration loaded', [
    'environment' => 'production',
    'cache_driver' => 'redis',
]);

// When to use:
// - System state changes
// - Startup/shutdown events
// - Configuration applied
```

### WARNING
Warning situations that don't prevent operation.

```php
Log::warning('Slow request detected', [
    'endpoint' => '/api/genders',
    'duration_ms' => 2500,
    'threshold_ms' => 1000,
]);

// When to use:
// - Performance degradation
// - Deprecated API usage
// - Invalid input (but recoverable)
// - Rate limiting triggered
// - Brute force attempts
```

### ERROR
Error conditions requiring attention but not critical.

```php
Log::error('Database query failed', [
    'query' => 'UPDATE genders SET name = ?',
    'error' => 'Duplicate entry',
    'code' => 'ER_DUP_ENTRY',
]);

// When to use:
// - Operation failed
// - Exception caught & handled
// - Data validation failed
// - External service unavailable
// - Resource not found (some cases)
```

### CRITICAL
Critical conditions beyond normal operation.

```php
Log::critical('Database connection failed', [
    'host' => 'db.example.com',
    'port' => 3306,
    'error' => 'Connection timeout',
]);

// When to use:
// - Database unreachable
// - Configuration invalid
// - Required service down
// - System integrity compromised
```

### ALERT & EMERGENCY
Immediate action required. System unusable.

```php
Log::alert('Security breach detected', [
    'violation' => 'unauthorized_access',
    'user_id' => 99,
    'resource_accessed' => 'admin_panel',
]);

// When to use:
// - Security violations
// - System crash imminent
// - Critical component failed
// - Data corruption detected
```

---

## Structured Logging

Always include context data with logs. Structured logs are easier to parse, filter, and analyze.

### Good Structured Log

```php
Log::info('User created', [
    'user_id' => 123,
    'email' => 'user@example.com',
    'role' => 'admin',
    'created_by' => 5,
    'timestamp' => now()->toIso8601String(),
    'ip' => request()->ip(),
]);
```

### Better with Nested Structure

```php
Log::info('API request completed', [
    'request' => [
        'method' => 'POST',
        'path' => '/api/genders',
        'ip' => '192.168.1.1',
        'user_agent' => request()->userAgent(),
    ],
    'response' => [
        'status' => 201,
        'time_ms' => 45,
    ],
    'user' => [
        'id' => 5,
        'email' => 'admin@example.com',
    ],
]);
```

### Avoid In Context

```php
// ❌ DON'T: Sensitive information
Log::info('User login', ['password' => 'secret123']);

// ❌ DON'T: Entire objects (not serializable)
Log::info('User created', ['user' => $userObject]);

// ❌ DON'T: Circular references
Log::info('Error', ['error' => $exception->getPrevious()]);

// ✅ DO: Only necessary, safe data
Log::info('User login', ['user_id' => 123, 'email' => 'user@example.com']);
```

---

## Common Scenarios

### Authentication

```php
// Login attempt
Log::info('Login attempt', [
    'email' => $email,
    'ip' => request()->ip(),
    'timestamp' => now()->toIso8601String(),
]);

// Login success
Log::info('User logged in', [
    'user_id' => $user->id,
    'email' => $user->email,
    'ip' => request()->ip(),
    'session_id' => session()->getId(),
]);

// Login failed
Log::warning('Login failed', [
    'email' => $email,
    'reason' => 'invalid_credentials',
    'attempts' => $failureCount,
    'ip' => request()->ip(),
]);

// Brute force detected
Log::alert('Brute force attempt blocked', [
    'email' => $email,
    'attempts' => 6,
    'time_window_seconds' => 60,
    'ip' => request()->ip(),
]);

// Logout
Log::info('User logged out', [
    'user_id' => auth()->id(),
    'session_duration_seconds' => $duration,
]);
```

### API Requests

```php
// Successful API call
Log::info('API request success', [
    'endpoint' => $request->path(),
    'method' => $request->method(),
    'status' => 200,
    'user_id' => auth()->id(),
    'duration_ms' => $duration,
]);

// Failed API call
Log::error('API request failed', [
    'endpoint' => $request->path(),
    'method' => $request->method(),
    'status' => 500,
    'error' => $exception->getMessage(),
    'user_id' => auth()->id(),
]);

// Slow request
Log::warning('Slow API request', [
    'endpoint' => $request->path(),
    'method' => $request->method(),
    'duration_ms' => 2500,
    'threshold_ms' => 1000,
    'user_id' => auth()->id(),
]);
```

### Data Operations

```php
// Create
Log::info('Resource created', [
    'resource' => 'gender',
    'resource_id' => $gender->id,
    'user_id' => auth()->id(),
    'data' => $validated,
]);

// Update
Log::info('Resource updated', [
    'resource' => 'gender',
    'resource_id' => $gender->id,
    'user_id' => auth()->id(),
    'changes' => [
        'name' => ['old' => $old, 'new' => $new],
    ],
]);

// Delete
Log::info('Resource deleted', [
    'resource' => 'gender',
    'resource_id' => $id,
    'user_id' => auth()->id(),
    'soft_deleted' => false,
]);
```

### Validation Errors

```php
Log::warning('Validation failed', [
    'endpoint' => $request->path(),
    'errors' => $validator->errors()->toArray(),
    'user_id' => auth()->id(),
    'timestamp' => now()->toIso8601String(),
]);
```

### Authorization

```php
// Permission denied
Log::warning('Permission denied', [
    'user_id' => auth()->id(),
    'action' => 'delete',
    'resource' => 'user',
    'resource_id' => $id,
    'required_permission' => 'user.delete',
]);

// Unauthorized access attempt
Log::alert('Unauthorized access attempt', [
    'user_id' => auth()->id(),
    'resource' => 'admin_panel',
    'ip' => request()->ip(),
    'user_agent' => request()->userAgent(),
]);
```

### Module Generation

```php
// Start
Log::info('Module generation started', [
    'module_name' => 'Product',
    'type' => 'item',
    'permissions' => ['view', 'create', 'edit', 'delete'],
    'initiated_by' => auth()->id(),
]);

// Success
Log::info('Module generation completed', [
    'module_name' => 'Product',
    'files_created' => 9,
    'permissions_created' => 4,
    'duration_seconds' => 2,
    'initiated_by' => auth()->id(),
]);

// Failure
Log::error('Module generation failed', [
    'module_name' => 'Product',
    'reason' => 'Marker not found',
    'file' => 'reactTheme/src/store/index.ts',
    'marker' => '// __MODULE_REDUCER_IMPORTS__',
    'initiated_by' => auth()->id(),
]);
```

### Queue Jobs

```php
// Job started
Log::info('Job started', [
    'job' => 'ProvisionTenantJob',
    'job_id' => $job->id(),
    'tenant_id' => $tenant->id,
    'started_at' => now()->toIso8601String(),
]);

// Job completed
Log::info('Job completed', [
    'job' => 'ProvisionTenantJob',
    'job_id' => $job->id(),
    'tenant_id' => $tenant->id,
    'duration_seconds' => $duration,
    'result' => 'success',
]);

// Job failed
Log::error('Job failed', [
    'job' => 'ProvisionTenantJob',
    'job_id' => $job->id(),
    'tenant_id' => $tenant->id,
    'attempts' => $job->attempts(),
    'error' => $exception->getMessage(),
    'exception_class' => get_class($exception),
]);
```

### Multi-Tenancy

```php
// Tenant created
Log::info('Tenant created', [
    'tenant_id' => $tenant->id,
    'tenant_name' => $tenant->name,
    'domain' => $domain,
    'created_by' => auth()->id(),
]);

// Tenant data access
Log::info('Tenant data accessed', [
    'tenant_id' => tenant('id'),
    'user_id' => auth()->id(),
    'resource' => 'genders',
    'action' => 'index',
    'record_count' => $count,
]);

// Isolation violation
Log::alert('Tenant isolation violation detected', [
    'violation_type' => 'cross_tenant_access',
    'user_tenant' => auth()->user()->tenant_id,
    'accessed_tenant' => $attemptedTenant,
    'resource' => $resource,
    'ip' => request()->ip(),
]);
```

---

## Channels & Configuration

### Default Configuration

```php
// config/logging.php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['single'],
    ],
    'single' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
    ],
]
```

### Using Different Channels

```php
// Log to specific channel
Log::channel('security')->alert('Suspicious activity detected', [...]);
Log::channel('performance')->warning('Slow query', [...]);
Log::channel('audit')->info('Data modification', [...]);
```

### Configure Log Level

In production, adjust `LOG_LEVEL` in `.env`:

```bash
# Development (verbose)
LOG_LEVEL=debug

# Staging (balanced)
LOG_LEVEL=info

# Production (less verbose)
LOG_LEVEL=warning
```

---

## Best Practices

### ✅ DO

1. **Include Context**
   ```php
   Log::info('User created', ['user_id' => $id, 'email' => $email]);
   ```

2. **Use Appropriate Levels**
   ```php
   Log::debug('Variable value: ' . $var);        // Debug
   Log::info('User logged in successfully');     // Info
   Log::warning('Rate limit approaching');       // Warning
   Log::error('Database connection failed');     // Error
   ```

3. **Add Timestamps**
   ```php
   Log::info('Event occurred', ['timestamp' => now()->toIso8601String()]);
   ```

4. **Include User Information**
   ```php
   Log::info('Action taken', ['user_id' => auth()->id()]);
   ```

5. **Include Request Details**
   ```php
   Log::info('API call', ['ip' => request()->ip(), 'user_agent' => ...]);
   ```

6. **Structured Hierarchy**
   ```php
   Log::info('Request processed', [
       'request' => ['method' => 'POST', 'path' => '/api/users'],
       'response' => ['status' => 201, 'time_ms' => 45],
       'user' => ['id' => 1, 'role' => 'admin'],
   ]);
   ```

### ❌ DON'T

1. **Don't Log Passwords**
   ```php
   // ❌ WRONG
   Log::info('Login', ['password' => $password]);
   
   // ✅ CORRECT
   Log::info('Login', ['email' => $email]);
   ```

2. **Don't Log Sensitive Data**
   ```php
   // ❌ WRONG
   Log::info('Card payment', ['card_number' => '4111-1111-1111-1111']);
   
   // ✅ CORRECT
   Log::info('Card payment', ['last_4_digits' => '1111', 'amount' => 99.99]);
   ```

3. **Don't Log Entire Objects**
   ```php
   // ❌ WRONG
   Log::info('User created', ['user' => $user]);
   
   // ✅ CORRECT
   Log::info('User created', ['user_id' => $user->id, 'email' => $user->email]);
   ```

4. **Don't Use String Concatenation**
   ```php
   // ❌ WRONG
   Log::info('User ' . $id . ' logged in');
   
   // ✅ CORRECT
   Log::info('User logged in', ['user_id' => $id]);
   ```

5. **Don't Log Circular References**
   ```php
   // ❌ WRONG
   Log::info('Error', ['exception' => $e]);
   
   // ✅ CORRECT
   Log::error('Error occurred', [
       'message' => $e->getMessage(),
       'code' => $e->getCode(),
       'file' => $e->getFile(),
   ]);
   ```

---

## Log Queries

### Search Logs

```bash
# Find specific message
grep "User logged in" storage/logs/laravel.log

# Find errors
grep "ERROR" storage/logs/laravel.log

# Find warnings
grep "WARNING" storage/logs/laravel.log

# Case insensitive search
grep -i "error" storage/logs/laravel.log

# Find multiple patterns
grep -E "(ERROR|CRITICAL)" storage/logs/laravel.log

# Count occurrences
grep -c "User created" storage/logs/laravel.log

# Show context (lines before/after)
grep -B 2 -A 2 "Exception" storage/logs/laravel.log
```

### Real-Time Monitoring

```bash
# Watch logs in real-time
tail -f storage/logs/laravel.log

# Filter while watching
tail -f storage/logs/laravel.log | grep "ERROR"

# Exclude health check logs
tail -f storage/logs/laravel.log | grep -v "GET /api/health"
```

### Log Analysis

```bash
# Group by level
grep -o "\[.*\]" storage/logs/laravel.log | sort | uniq -c | sort -rn

# Count by user
grep "user_id" storage/logs/laravel.log | grep -o "user_id.*[0-9]" | sort | uniq -c

# Errors in last hour
find storage/logs -type f -mmin -60 | xargs grep "ERROR"
```

---

## Testing Logs

### Unit Test

```php
public function test_user_creation_logged(): void
{
    Log::info('User created', ['user_id' => 123, 'email' => 'test@example.com']);
    
    $log = file_get_contents(storage_path('logs/laravel.log'));
    $this->assertStringContainsString('User created', $log);
    $this->assertStringContainsString('123', $log);
}
```

### Mock Logging

```php
public function test_api_error_logging(): void
{
    Log::shouldReceive('error')
        ->with('API error', \Mockery::any())
        ->once();
    
    // Trigger error
    $this->getJson('/api/missing')->assertNotFound();
}
```

---

## Summary

- **Log Levels**: DEBUG → INFO → NOTICE → WARNING → ERROR → CRITICAL → ALERT → EMERGENCY
- **Structure**: Always include context, user info, timestamps
- **Sensitivity**: Never log passwords, card numbers, or sensitive data
- **Channels**: Use stack channel by default
- **Production**: Set `LOG_LEVEL=warning` or higher
- **Testing**: Verify critical logs are written

See [LoggingTest.php](tests/Feature/LoggingTest.php) for comprehensive examples.
