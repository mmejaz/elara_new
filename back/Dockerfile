FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Don't advertise the PHP version in response headers (defense-in-depth; the
# SecurityHeaders middleware also strips it at runtime).
RUN echo "expose_php = Off" > /usr/local/etc/php/conf.d/zz-security.ini

# Performance tuning. The big win is opcache.validate_timestamps=0: opcache stops
# stat-ing every PHP file per request, which is what caused multi-second latency
# spikes on cold workers over a bind-mounted source tree. Trade-off: PHP code
# changes need an FPM reload to take effect (`kill -USR2 1`) — correct for
# production (immutable code); for active local PHP editing, reload after edits.
# realpath_cache tuning further cuts path-resolution stat calls on slow mounts.
RUN { \
      echo "opcache.enable=1"; \
      echo "opcache.memory_consumption=256"; \
      echo "opcache.interned_strings_buffer=16"; \
      echo "opcache.max_accelerated_files=20000"; \
      echo "opcache.validate_timestamps=0"; \
      echo "realpath_cache_size=4096k"; \
      echo "realpath_cache_ttl=600"; \
    } > /usr/local/etc/php/conf.d/zz-opcache.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install --no-interaction --no-scripts --no-autoloader --ignore-platform-reqs

COPY . .

RUN composer dump-autoload --optimize --no-scripts --ignore-platform-reqs

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
