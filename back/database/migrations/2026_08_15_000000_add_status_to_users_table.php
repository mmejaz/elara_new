<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Account status so an admin can deactivate or block a user. Both states stop
 * the user from logging in; the difference is intent (deactivated = temporary /
 * routine, blocked = enforcement). Every non-active transition records a reason,
 * when it happened, and who did it — an audit trail on the row itself.
 *
 * Mirrors the tenant migration of the same name: on this branch the central DB
 * also carries the app schema, so the central `users` table needs these columns
 * too (an admin manages central users from the same UI).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('active')->after('email'); // active | deactivated | blocked
            $table->text('status_reason')->nullable()->after('status');
            $table->timestamp('status_changed_at')->nullable()->after('status_reason');
            $table->foreignId('status_changed_by')->nullable()->after('status_changed_at')
                ->constrained('users')->nullOnDelete();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['status_changed_by']);
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'status_reason', 'status_changed_at', 'status_changed_by']);
        });
    }
};
