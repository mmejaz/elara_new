<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-role dashboard widget visibility (tenant copy). See the central migration
 * for details. Roles live in each database, so this table exists in both.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->string('widget_key');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->unique(['role_id', 'widget_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_dashboard_widgets');
    }
};
