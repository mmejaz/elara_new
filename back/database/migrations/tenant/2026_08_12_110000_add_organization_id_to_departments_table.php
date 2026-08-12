<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            // The one column that switches a department between "shared" and
            // "scoped":
            //   NULL      → shared: belongs to the whole tenant, every org sees it
            //   <org id>  → scoped: owned by that organization (and its sub-orgs)
            // On org deletion its departments fall back to shared (nullOnDelete)
            // rather than disappearing.
            $table->foreignId('organization_id')
                ->nullable()
                ->after('name')
                ->constrained('organizations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });
    }
};
