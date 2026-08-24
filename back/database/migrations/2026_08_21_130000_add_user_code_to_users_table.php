<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A human-readable, unique User ID (e.g. USR-00001) shown in the UI, distinct
 * from the auto-increment primary key. Nullable + unique so the value can be
 * assigned right AFTER insert — the model's `created` hook derives it from the
 * id (which only exists post-insert). Existing rows are backfilled here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_code')->nullable()->unique()->after('id');
        });

        // Backfill existing users: USR-<zero-padded id>.
        DB::statement("UPDATE users SET user_code = CONCAT('USR-', LPAD(id, 5, '0')) WHERE user_code IS NULL");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['user_code']);
            $table->dropColumn('user_code');
        });
    }
};
