<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('designation')->nullable()->after('phone');
            $table->string('country')->nullable()->after('designation');
            $table->string('city')->nullable()->after('country');
            $table->text('bio')->nullable()->after('city');
            $table->json('settings')->nullable()->after('bio');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'designation', 'country', 'city', 'bio', 'settings']);
        });
    }
};
