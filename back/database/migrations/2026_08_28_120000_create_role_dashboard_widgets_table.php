<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-role dashboard widget visibility. A row means "this role has an explicit
 * setting for this widget". No row for a (role, widget) pair defaults to visible.
 * The user's dashboard is the UNION across their roles (see DashboardSettingService).
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
