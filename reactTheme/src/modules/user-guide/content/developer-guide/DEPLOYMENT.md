# Elara Deployment Guide

Complete runbook for deploying Elara to production, including pre-deployment checks, deployment steps, rollback procedures, and operational monitoring.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Production Configuration](#production-configuration)
4. [Deployment Process](#deployment-process)
5. [Health Checks](#health-checks)
6. [Database Management](#database-management)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, complete ALL items:

### Code Quality

- [ ] All tests passing: `php artisan test`
- [ ] No linting errors: `./vendor/bin/pint --test`
- [ ] Code reviewed and approved
- [ ] No console.log/var_dump left in code
- [ ] No hardcoded secrets in code
- [ ] All dependencies up to date

### Database

- [ ] All migrations reviewed for safety
- [ ] Rollback plan documented for migrations
- [ ] Database backup strategy in place and tested
- [ ] Migration tested on staging first
- [ ] Schema changes don't break existing queries
- [ ] Indexes added for performance-critical queries

### Deployment Infrastructure

- [ ] Production server(s) available and healthy
- [ ] SSL certificate valid and not expiring soon
- [ ] Database host accessible and responsive
- [ ] Redis/Cache available (if using)
- [ ] File storage (S3, local, etc.) available
- [ ] Email service configured (SMTP, SendGrid, etc.)
- [ ] GitHub Actions or CI/CD pipeline working

### Application Configuration

- [ ] `.env.production` configured with all required variables
- [ ] Secrets stored in CI/CD environment (not in `.env` file)
- [ ] `APP_DEBUG=false` in production
- [ ] `APP_KEY` set (and unique per environment)
- [ ] `SANCTUM_STATEFUL_DOMAINS` configured correctly
- [ ] CORS whitelist updated with production domain
- [ ] Session cookie settings for HTTPS

### Documentation

- [ ] Deployment runbook created and reviewed
- [ ] Rollback procedure documented
- [ ] Known issues documented
- [ ] On-call contact information available
- [ ] Monitoring/alert contacts configured

### Load Testing

- [ ] Load test completed (if significant changes)
- [ ] Performance acceptable under expected load
- [ ] No N+1 query problems discovered
- [ ] Cache strategy validated
- [ ] API rate limits reasonable

---

## Environment Setup

### Server Requirements

```
- PHP 8.3 or higher
- MySQL 8.0 or PostgreSQL 12+
- Redis 6.0+ (for cache/queue, recommended)
- Composer (for dependency management)
- Node.js 18+ (for frontend build)
- 2+ GB RAM minimum
- 10+ GB disk space
- Modern Linux distribution (Ubuntu 20.04+, CentOS 8+, etc.)
```

### Directory Structure

```
/var/www/elara/
├── back/                    # Laravel backend
├── reactTheme/              # React frontend
├── storage/                 # Logs, cache, uploads
│   ├── logs/
│   ├── cache/
│   └── uploads/
└── .env                      # Production environment file (NOT in git)
```

### PHP Configuration

```ini
# /etc/php/8.4/fpm/php.ini
memory_limit = 512M
max_execution_time = 60
max_input_time = 60
upload_max_filesize = 10M
post_max_size = 10M

# OPCache (essential for production)
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.validate_timestamps=0
opcache.max_accelerated_files=20000
opcache.fast_shutdown=1
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com *.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/elara;

    # Laravel public directory
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Backend API
    location ~ ^/api/ {
        try_files $uri /index.php?$query_string;
    }

    # Frontend
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PHP handling
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block sensitive files
    location ~ /\.env {
        deny all;
    }

    location ~ /storage/ {
        deny all;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### MySQL Configuration

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Character set
[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

---

## Production Configuration

### Create `.env.production`

```bash
# Application
APP_NAME=Elara
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_UNIQUE_KEY_HERE
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=elara_production
DB_USERNAME=elara_app
DB_PASSWORD=VERY_STRONG_PASSWORD_MIN_32_CHARS

# Tenancy
TENANCY_DATABASE_DRIVER=mysql
TENANCY_DB_TEMPLATE_SOURCE=central

# Cache & Queue (use Redis for production)
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=your-redis-host
REDIS_PASSWORD=REDIS_PASSWORD_IF_AUTH_REQUIRED
REDIS_PORT=6379

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=.yourdomain.com
SESSION_SAME_SITE=lax

# Authentication
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,*.yourdomain.com,api.yourdomain.com
SANCTUM_ENCRYPT_COOKIES=true

# Frontend
FRONTEND_URL=https://yourdomain.com
VITE_BACKEND_URL=https://yourdomain.com

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning
SENTRY_DSN=YOUR_SENTRY_DSN_IF_USING_ERROR_TRACKING

# Mail
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@yourcompany.com
MAIL_PASSWORD=YOUR_EMAIL_PASSWORD
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=Elara

# File Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-bucket-name

# Broadcasting
BROADCAST_DRIVER=redis
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=

# Miscellaneous
TRUSTED_PROXIES=*
TRUSTED_HOSTS=yourdomain.com,*.yourdomain.com
SECURE_PROXY_URL_SCHEME=https
```

### Secrets Management

**Store secrets in GitHub Actions Secrets, not in `.env`:**

```bash
# In GitHub repository settings: Settings → Secrets and variables → Actions

# Create secrets:
PRODUCTION_APP_KEY
PRODUCTION_DB_PASSWORD
PRODUCTION_REDIS_PASSWORD
PRODUCTION_AWS_ACCESS_KEY_ID
PRODUCTION_AWS_SECRET_ACCESS_KEY
PRODUCTION_SENTRY_DSN
PRODUCTION_MAIL_PASSWORD
```

**Then reference in deployment:**

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set .env
        run: |
          cp back/.env.example back/.env.production
          echo "APP_KEY=${{ secrets.PRODUCTION_APP_KEY }}" >> back/.env.production
          echo "DB_PASSWORD=${{ secrets.PRODUCTION_DB_PASSWORD }}" >> back/.env.production
          # ... more secrets
```

---

## Deployment Process

### Automated Deployment (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'back/**'
      - 'reactTheme/**'
      - '.github/workflows/deploy.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: elara_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: mysql, redis

      - name: Install backend dependencies
        working-directory: back
        run: composer install --no-interaction --no-progress

      - name: Run tests
        working-directory: back
        run: php artisan test --parallel

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install frontend dependencies
        working-directory: reactTheme
        run: npm ci

      - name: Build frontend
        working-directory: reactTheme
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          port: 22
          script: |
            cd /var/www/elara
            git pull origin main
            
            # Backend
            cd back
            composer install --no-dev --optimize-autoloader
            cp .env.production .env
            php artisan migrate --force
            php artisan cache:clear
            php artisan config:cache
            cd ..
            
            # Frontend
            cd reactTheme
            npm ci --production
            npm run build
            cd ..
            
            # Restart services
            sudo supervisorctl restart laravel-worker
            sudo systemctl reload php-fpm
            sudo systemctl reload nginx
            
            # Health check
            curl -f https://yourdomain.com/api/health || exit 1
```

### Manual Deployment

If not using GitHub Actions, follow these steps:

```bash
# 1. SSH into production server
ssh deploy@yourdomain.com

# 2. Navigate to app directory
cd /var/www/elara

# 3. Pull latest code
git pull origin main

# 4. Backup database
mysqldump elara_production -u elara_app -p > \
  backups/backup-$(date +%Y%m%d-%H%M%S).sql

# 5. Install/update dependencies
cd back
composer install --no-dev --optimize-autoloader

# 6. Set environment
cp .env.production .env

# 7. Run migrations
php artisan migrate --force --step

# 8. Clear cache
php artisan cache:clear
php artisan config:cache
php artisan route:cache

# 9. Build frontend
cd ../reactTheme
npm ci --production
npm run build

# 10. Restart services
cd ..
sudo supervisorctl restart laravel-worker
sudo systemctl reload php-fpm
sudo systemctl reload nginx

# 11. Monitor logs
tail -f storage/logs/laravel.log
```

---

## Health Checks

### Application Health Endpoint

```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response (200 OK):
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:45Z",
  "database": "ok",
  "cache": "ok",
  "queue": "ok",
  "disk_usage": 45,
  "memory_usage": 62
}

# If unhealthy (503 Service Unavailable):
# Check logs: tail -f storage/logs/laravel.log
```

### Manual Health Checks

```bash
# Database connectivity
mysql -h $DB_HOST -u $DB_USER -p -e "SELECT 1"

# Redis connectivity
redis-cli -h $REDIS_HOST PING

# PHP-FPM status
curl http://localhost:9000/status

# Nginx status
curl http://localhost/nginx_status

# Disk space
df -h /var/www/elara

# Memory
free -h

# Queue status
php artisan queue:size

# Check failed jobs
php artisan queue:failed
```

---

## Database Management

### Create Backups

```bash
# Full backup (recommended nightly)
mysqldump \
  -h $DB_HOST \
  -u $DB_USER \
  -p \
  elara_production \
  > /backups/elara-$(date +%Y%m%d-%H%M%S).sql

# Compress to save space
gzip /backups/elara-*.sql

# Backup retention (keep last 30 days)
find /backups -name "elara-*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# 1. Stop application
sudo supervisorctl stop laravel-worker

# 2. Restore database
gzip -dc /backups/elara-20250115-100000.sql.gz | \
  mysql -h $DB_HOST -u $DB_USER -p elara_production

# 3. Run migrations if needed
php artisan migrate

# 4. Clear cache
php artisan cache:clear

# 5. Restart application
sudo supervisorctl start laravel-worker
```

### Migration Safety

```bash
# Test migration on staging first
php artisan migrate --pretend

# Run in steps (easier to rollback)
php artisan migrate --step

# Check migration status
php artisan migrate:status

# Rollback last batch
php artisan migrate:rollback

# Rollback to specific migration
php artisan migrate:rollback --target=2025_01_10_100000
```

---

## Rollback Procedures

### Rollback After Failed Deployment

```bash
# 1. Stop application services
sudo supervisorctl stop laravel-worker

# 2. Revert code
git revert HEAD
git push origin main

# 3. Restore database backup (if schema changed)
gzip -dc /backups/elara-pre-deployment.sql.gz | \
  mysql -h $DB_HOST -u $DB_USER -p elara_production

# 4. Clear cache
php artisan cache:clear

# 5. Restart services
sudo supervisorctl start laravel-worker
sudo systemctl restart php-fpm
sudo systemctl restart nginx

# 6. Verify health
curl -f https://yourdomain.com/api/health

# 7. Monitor logs
tail -f storage/logs/laravel.log
```

### Rollback Specific Migration

```bash
# If only database schema needs rollback
php artisan migrate:rollback --step=1

# Verify
php artisan migrate:status
```

### Rollback from Tag

```bash
# If deploying with git tags for versioning
git tag v1.2.0
git push origin v1.2.0

# Rollback to previous tag
git checkout v1.1.0
git pull origin v1.1.0

# Redeploy from tag
php artisan migrate:rollback
php artisan migrate
```

---

## Monitoring & Alerts

### Application Monitoring

```bash
# Sentry (error tracking)
# Configure in .env: SENTRY_DSN=https://key@sentry.io/project

# New Relic (APM - Application Performance Monitoring)
# Install agent: composer require newrelic/newrelic-php-agent
# Configure in .env: NEW_RELIC_LICENSE_KEY=your-key

# DataDog (infrastructure + app monitoring)
# Install agent and setup integration

# CloudWatch (if using AWS)
# Setup log groups and metrics
```

### Log Monitoring

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Filter errors
grep ERROR storage/logs/laravel.log

# Monitor in real-time
tail -f storage/logs/laravel.log | grep -v "GET /api/health"

# Query logs with specific date
cat storage/logs/laravel-2025-01-15.log | grep ERROR
```

### Alert Configuration

**Setup alerts for:**

- [ ] Application errors (Sentry, DataDog)
- [ ] High error rate (>1% of requests)
- [ ] High latency (>1s response time)
- [ ] Queue backlog (>100 jobs stuck)
- [ ] Disk usage (>90% full)
- [ ] Database slow queries (>2s)
- [ ] Redis memory (>90% used)
- [ ] Memory usage (>80% of available)
- [ ] Certificate expiry (30 days before)

### Monitoring Dashboard

Create a monitoring dashboard with:

```
- Requests per second
- Error rate %
- Response time (avg, p50, p95, p99)
- Queue job count
- Active database connections
- Cache hit rate
- Disk usage %
- Memory usage %
- CPU usage %
```

---

## Troubleshooting

### 502 Bad Gateway

**Cause:** PHP-FPM crashed or not responding

```bash
# Check PHP-FPM status
systemctl status php8.4-fpm

# Restart PHP-FPM
sudo systemctl restart php8.4-fpm

# Check logs
tail -f /var/log/php8.4-fpm.log
```

### 503 Service Unavailable

**Cause:** Application maintenance mode or database unreachable

```bash
# Check if in maintenance mode
php artisan down   # to disable
php artisan up     # to enable

# Check database connection
php artisan tinker
> DB::connection()->getPdo()

# Check logs
tail -f storage/logs/laravel.log
```

### High Memory Usage

**Cause:** Memory leak, large dataset queries, or inefficient code

```bash
# Check PHP memory limit
php -i | grep memory_limit

# Monitor real-time
php artisan tinker
> DB::connection()->enableQueryLog(); 
> // Run query
> dd(DB::getQueryLog()); // Check query performance

# Use profiler (Xdebug)
```

### Queue Jobs Stuck

**Cause:** Queue worker crashed or hung

```bash
# Check queue status
php artisan queue:size

# Check failed jobs
php artisan queue:failed

# Restart queue worker
sudo supervisorctl restart laravel-worker

# Retry failed jobs
php artisan queue:retry all
```

### Slow API Responses

**Cause:** Unoptimized queries, N+1 problem, or high load

```bash
# Enable query logging
# In .env: DB_LOG_QUERIES=true

# Check slow queries
mysql -e "SELECT * FROM mysql.slow_log LIMIT 10;"

# Add indexes to queried columns
php artisan tinker
> // Add indexes for frequently queried columns

# Use caching
Cache::remember('key', 3600, fn () => expensiveQuery())
```

### Deployment Fails

**Cause:** Migration error, insufficient permissions, or disk space

```bash
# Check disk space
df -h /var/www/elara

# Check directory permissions
ls -la /var/www/elara
chmod -R 755 /var/www/elara
chown -R www-data:www-data storage bootstrap/cache

# Test migration locally first
php artisan migrate --pretend

# Check logs
tail -f storage/logs/laravel.log
```

### Frontend Not Loading

**Cause:** Build failed or static files not served

```bash
# Rebuild frontend
cd reactTheme
npm run build

# Check assets are in public/
ls -la public/dist/

# Verify Nginx is serving static files
curl -I https://yourdomain.com/dist/main.js
```

---

## Quick Reference

### Common Commands

```bash
# Clear everything
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:clear

# Database
php artisan migrate
php artisan migrate:rollback
php artisan db:seed

# Queue
php artisan queue:work
php artisan queue:retry all
php artisan queue:failed

# Logs
tail -f storage/logs/laravel.log
grep ERROR storage/logs/laravel.log

# Permissions
sudo fix-permissions /var/www/elara

# Restart services
sudo supervisorctl restart laravel-worker
sudo systemctl restart php-fpm nginx
```

### Emergency Contacts

- **Production Alert:** on-call-team@company.com
- **Database Admin:** dba@company.com
- **DevOps/Infrastructure:** devops@company.com
- **SSL/Security:** security@company.com

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Next Review Date:** 2025-02-15
