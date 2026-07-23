-- Database-per-tenant: Stancl provisions one database per customer, named
-- `tenant<id>` (prefix from config/tenancy.php -> database.prefix).
--
-- The app user therefore needs rights to CREATE and DROP those databases, not
-- just to read/write the central one. MySQL supports a wildcard on the database
-- name, so this stays scoped to tenant databases -- elara_user still cannot
-- touch mysql, sys, or anything else outside the pattern.
--
-- Runs automatically on a fresh volume via docker-entrypoint-initdb.d. Existing
-- volumes keep their old grants; re-apply by hand or recreate the volume.
GRANT ALL PRIVILEGES ON `tenant%`.* TO 'elara_user'@'%';
FLUSH PRIVILEGES;
