# Database — Tables

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Table reference. Each row is labelled **C** (central DB), **T** (tenant DB), or
**C+T** (exists in both, as independent tables per database).

## Tenancy (central)

| Table | Scope | Key columns |
|---|---|---|
| `tenants` | C | `id` (string), `data` (JSON: name, status, admin_*, department_mode), timestamps |
| `domains` | C | `id`, `domain` (unique), `tenant_id` → tenants |

## Identity & access

| Table | Scope | Key columns |
|---|---|---|
| `users` | C+T | `id`, `name`, `email` (unique), `password`, `phone`, `designation`, `country`, `city`, `bio`, `settings` (JSON), `avatar`, timestamps |
| `roles` | C+T | `id`, `name`, `guard_name` — one row per role per guard (`web`, `sanctum`) |
| `permissions` | C+T | `id`, `name` (`<module>.<action>`), `guard_name` |
| `model_has_roles`, `model_has_permissions`, `role_has_permissions` | C+T | spatie pivots |
| `personal_access_tokens` | C+T | Sanctum tokens (unused for SPA cookie auth, present) |
| `sessions` | C+T | database session driver |

## Organizations & HR master data

| Table | Scope | Key columns |
|---|---|---|
| `organizations` | C+T | `id`, `name`, `parent_id` (self-FK, hierarchy) |
| `organization_user` | C+T | `organization_id`, `user_id` (membership pivot) |
| `departments` | C+T | `id`, `name`, `parent_id` (self-FK, `nullOnDelete`), `organization_id` (nullable = shared) |
| `designations` | C+T | `id`, `name` |
| `leave_types` | C+T | `id`, `name` |
| `document_types` | C+T | `id`, `name` |

## Lookups (tenant)

| Table | Scope | Key columns |
|---|---|---|
| `genders` | T | `id`, `name` |
| `countries` | T | `id`, `name` |
| `cities` | T | `id`, `name` |
| `application_types` | T | `id`, `name` |

## Platform (modules, settings, files)

| Table | Scope | Key columns |
|---|---|---|
| `modules` | C+T | `id`, `name`, `slug`, `icon`, `type` (group/item), `is_resourceful`, `parent_id`, `order`, `is_visible`, `is_system`, `SoftDeletes` |
| `global_settings` | T | `id`, `name` |
| `global_setting_fields` | T | field definitions (label, key, type, options, …) |
| `global_setting_records` | T | values keyed by field |
| `files` | C+T | polymorphic `fileable_type`/`fileable_id`, `collection`, `disk`, `path`, `uploaded_by` |

## System / infrastructure

| Table | Scope | Purpose |
|---|---|---|
| `cache`, `cache_locks` | C+T | database cache |
| `central_cache` | C | central-specific cache table |
| `jobs`, `job_batches`, `failed_jobs` | C+T | database queue |
| `password_reset_tokens` | C+T | Laravel default (reset flow not wired in the SPA) |
| `agent_conversations` | C | from `laravel/ai` (AI tooling; wiring in progress) |

> **Not determined from the project:** exact column types/indexes per table are in
> the migration files under `back/database/migrations` and `.../tenant`; this page
> summarizes the columns that matter for development. Regenerate with
> `SHOW CREATE TABLE <name>` when you need the authoritative DDL.
