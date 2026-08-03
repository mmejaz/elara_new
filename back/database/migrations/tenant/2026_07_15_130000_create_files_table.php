<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Central store for every uploaded file. Polymorphic one-to-many: each
        // file belongs to one owner model, grouped by an optional `collection`.
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->morphs('fileable');              // fileable_id, fileable_type
            $table->string('collection')->nullable(); // 'avatar', 'logo_light', 'attachments'…
            $table->string('name');                  // stored (unique) filename
            $table->string('original_name');         // the name the user uploaded
            $table->string('disk')->default('public');
            $table->string('path');                  // path on the disk
            $table->string('mime_type')->nullable();
            $table->string('extension', 32)->nullable();
            $table->unsignedBigInteger('size')->default(0); // bytes
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fileable_id', 'fileable_type', 'collection']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
