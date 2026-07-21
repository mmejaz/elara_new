<?php

return [

    // Where uploads are stored.
    'disk'      => 'public',
    'directory' => 'files',

    // Global upload constraints (max_size is in kilobytes, like Laravel's `max` rule).
    'max_size' => 4096, // 4 MB
    'mimes'    => ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'],

    /*
     | Per-collection overrides. Any collection listed here uses its own mimes /
     | max_size instead of the globals above (e.g. avatars are images only, ≤ 2 MB).
     */
    // SVG is intentionally excluded everywhere — it can carry embedded scripts
    // (stored-XSS when served inline). Add a sanitizer if you ever need it.
    'collections' => [
        'avatar'     => ['mimes' => ['jpg', 'jpeg', 'png', 'webp'], 'max_size' => 2048],
        'logo_light' => ['mimes' => ['jpg', 'jpeg', 'png', 'webp'], 'max_size' => 2048],
        'logo_dark'  => ['mimes' => ['jpg', 'jpeg', 'png', 'webp'], 'max_size' => 2048],
        'favicon'    => ['mimes' => ['ico', 'png'], 'max_size' => 512],
        // Image-type fields (logos, favicons…). `ico` is allowed so favicons work;
        // svg stays out deliberately (it can carry scripts).
        'images'     => ['mimes' => ['jpg', 'jpeg', 'png', 'webp', 'gif', 'ico'], 'max_size' => 4096],
    ],

];
