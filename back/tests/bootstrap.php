<?php

declare(strict_types=1);

/*
 * The Docker container exports APP_ENV=local as a real OS environment variable,
 * which wins over phpunit.xml's <env> entry however it is set. Force the testing
 * environment here — before Laravel's autoloader and env reader run — so
 * test-only configuration (notably the disabled tenancy database bootstrappers
 * in config/tenancy.php) actually applies.
 */
putenv('APP_ENV=testing');
$_ENV['APP_ENV'] = 'testing';
$_SERVER['APP_ENV'] = 'testing';

require __DIR__.'/../vendor/autoload.php';
