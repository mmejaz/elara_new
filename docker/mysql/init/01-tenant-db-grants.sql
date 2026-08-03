-- Multi-tenancy: each tenant gets its own database named `tenant<id>` (see
-- config/tenancy.php `database.prefix`). The app connects as elara_user, which
-- by default only has privileges on the central `elara` database and therefore
-- cannot CREATE/DROP tenant databases. Grant it full rights on any `tenant%`
-- database so `tenant:create` / `tenants:migrate` / tenant deletion work.
--
-- Runs once, on a fresh data directory, after the entrypoint has created
-- elara_user from MYSQL_USER. For an already-initialized volume, apply the same
-- grant manually as root.
GRANT ALL PRIVILEGES ON `tenant%`.* TO 'elara_user'@'%';
FLUSH PRIVILEGES;
