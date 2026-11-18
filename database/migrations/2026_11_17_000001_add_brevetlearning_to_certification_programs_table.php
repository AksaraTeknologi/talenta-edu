<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 1 batch program sertifikasi = 1 kelas di brevetlearning.id.
     * Kode kelas & platform induk dipakai tombol "Kirim ke Brevetlearning"
     * di tab Pendaftar.
     */
    public function up(): void
    {
        Schema::table('certification_programs', function (Blueprint $table) {
            $table->string('brevetlearning_course_code', 64)->nullable()->after('group_url');
            $table->string('brevetlearning_platform', 100)->nullable()->after('brevetlearning_course_code');
        });
    }

    public function down(): void
    {
        Schema::table('certification_programs', function (Blueprint $table) {
            $table->dropColumn(['brevetlearning_course_code', 'brevetlearning_platform']);
        });
    }
};
