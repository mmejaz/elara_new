<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Schema for an app: the custom fields the user defines (e.g. host, port, encryption).
        Schema::create('global_setting_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('global_setting_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('key');                 // machine key (snake of label), stable once created
            $table->string('type')->default('text'); // text|number|password|textarea|dropdown|boolean|date
            $table->json('options')->nullable();   // dropdown values
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Records: the rows the user adds against the fields, values keyed by field `key`.
        Schema::create('global_setting_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('global_setting_id')->constrained()->cascadeOnDelete();
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global_setting_records');
        Schema::dropIfExists('global_setting_fields');
    }
};
