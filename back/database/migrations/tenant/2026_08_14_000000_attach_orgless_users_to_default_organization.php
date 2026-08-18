<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Enforces the "every user belongs to at least one organization" rule for data
 * that predates it: attaches any user with no organization to the Default
 * Organization (or the first organization, if named differently).
 *
 * Tenant-scoped — the organization_user pivot only exists in tenant databases.
 * On a brand-new tenant no organization exists yet at migrate time, so this is a
 * no-op there; the seeder assigns the default org after seeding. Safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        $orgId = DB::table('organizations')->where('name', 'Default Organization')->value('id')
            ?? DB::table('organizations')->orderBy('id')->value('id');

        if (! $orgId) {
            return; // fresh tenant — no organizations yet; the seeder handles it
        }

        $orgLessUserIds = DB::table('users')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('organization_user')
                    ->whereColumn('organization_user.user_id', 'users.id');
            })
            ->pluck('id');

        $now = now();

        foreach ($orgLessUserIds as $userId) {
            DB::table('organization_user')->insert([
                'user_id'         => $userId,
                'organization_id' => $orgId,
                'created_at'      => $now,
                'updated_at'      => $now,
            ]);
        }
    }

    public function down(): void
    {
        // No-op: a backfilled attachment is indistinguishable from an intentional
        // one, so there's nothing safe to reverse.
    }
};
