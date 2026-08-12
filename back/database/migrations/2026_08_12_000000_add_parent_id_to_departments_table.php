<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            // Nullable: a department can be top-level. On parent deletion the
            // children fall back to top-level (SET NULL) rather than cascading —
            // matching the "children become top-level" deletion strategy.
            $table->foreignId('parent_id')
                ->nullable()
                ->after('name')
                ->constrained('departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
