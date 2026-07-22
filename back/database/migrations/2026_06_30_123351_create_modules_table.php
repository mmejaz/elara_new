<?php

use Database\Seeders\ModuleSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name');                       // "Students"
            $table->string('slug')->unique();             // "students" — route path + permission key
            $table->string('icon')->nullable();           // "TeamOutlined" (registry key, not a component)
            $table->string('type')->default('item');      // 'group' | 'item'
            $table->boolean('is_resourceful')->default(true); // CRUD leaf vs parent menu
            $table->foreignId('parent_id')->nullable()    // self-reference → hierarchy
                ->constrained('modules')->nullOnDelete();
            $table->unsignedInteger('order')->default(0); // sidebar position within parent
            $table->boolean('is_visible')->default(true); // hide without deleting
            $table->boolean('is_system')->default(false); // code-seeded core, cannot be deleted
            $table->text('description')->nullable();
            $table->json('meta')->nullable();             // extensible builder config (fields, badge, etc.)
            $table->timestamps();
            $table->softDeletes();
        });

        // Seed the system sidebar modules immediately so a fresh `migrate`
        // always has the menu present. Idempotent (matched by slug).
        (new ModuleSeeder)->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
