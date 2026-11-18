<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI'),
    ],

    // WhatsApp notifikasi. Blok ini identik di aksademy dan semua platform turunan (lihat aksademy/docs/platform-map.md).
    'whatsapp' => [
        // Gateway aktif: messara (default) | wablas. Ganti env lalu `php artisan config:clear`.
        'gateway' => env('DEFAULT_WA_GATEWAY', 'messara'),
        // Detik pesan yang sama (nomor + isi) ke nomor yang sama tidak dikirim ulang. 0 = nonaktif.
        'dedupe_ttl' => (int) env('WA_DEDUPE_TTL', 600),
        // Nomor WA utama yang dikenal peserta. Bila gateway aktif mengirim dari nomor lain, pesan diberi catatan.
        'primary_sender_number' => env('WA_PRIMARY_SENDER_NUMBER'),
        // Placeholder: :primary (nomor utama), :app (nama aplikasi). Kosongkan untuk menonaktifkan.
        'backup_sender_notice' => env('WA_BACKUP_SENDER_NOTICE', '_Pesan ini dikirim dari nomor lain milik :app. Nomor utama kami: wa.me/:primary_'),

        'messara' => [
            'domain' => env('MESSARA_DOMAIN_SERVER', env('DOMAIN_SERVER_MESSARA', 'https://messara.aksarateknologi.co.id')),
            'api_key' => env('MESSARA_API_KEY', env('API_KEY_MESSARA')),
            'secret_key' => env('MESSARA_SECRET_KEY', env('SECRET_KEY_MESSARA')),
            'sender_number' => env('MESSARA_SENDER_NUMBER'),
            'use_template' => env('WA_USE_TEMPLATE', true),
            'invoice_template_name' => env('WA_INVOICE_TEMPLATE_NAME', 'invoice_pembayaran_berhasil'),
        ],

        'wablas' => [
            'domain' => env('DOMAIN_SERVER_WABLAS') ?: 'https://sby.wablas.com',
            'token' => env('SECURITY_TOKEN_WABLAS'),
            'secret' => env('SECRET_KEY_WABLAS'),
            'sender_number' => env('WABLAS_SENDER_NUMBER'),
        ],
    ],

    // Kirim peserta batch sertifikasi ke kelas brevetlearning.id (token klien integrasi, ability `enroll`).
    'brevetlearning' => [
        'url' => env('BREVETLEARNING_API_URL'),
        'token' => env('BREVETLEARNING_ENROLL_TOKEN'),
        'default_platform' => env('BREVETLEARNING_DEFAULT_PLATFORM'),
        'timeout' => (int) env('BREVETLEARNING_API_TIMEOUT', 20),
    ],

];
