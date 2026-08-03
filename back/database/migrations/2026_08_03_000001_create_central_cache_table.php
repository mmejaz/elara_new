<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The application cache/session/queue tables moved into database/migrations/tenant
 * so each tenant owns them. But CACHE_STORE=database means the central context
 * (landlord commands, framework internals, `cache:clear`) also needs a `cache`
 * table on the central connection. Recreate just the cache tables centrally;
 * sessions and jobs stay tenant-only since the central app is CLI-only.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Guarded so it is a no-op where a `cache` table already exists — e.g.
        // the test database, which also loads the tenant migration path (its own
        // create_cache_table). Central and tenant DBs stay independent in prod.
        if (! Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->bigInteger('expiration')->index();
            });
        }

        if (! Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->bigInteger('expiration')->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};
