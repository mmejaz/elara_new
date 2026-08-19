# Coding Standards

Follow the patterns already in the codebase — consistency beats novelty. New code
should read like the surrounding code.

## Backend (Laravel / PHP)

- **PSR-12**, enforced by **Laravel Pint**: `docker compose exec backend ./vendor/bin/pint`.
- **Thin controllers.** Validate in a `FormRequest`, delegate to a `Service`,
  return `ApiResponse`. No business logic in controllers.
- **Services own logic + transactions.** Wrap multi-step writes in
  `DB::transaction(...)`.
- **Fillable via attribute:** `#[Fillable(['name', 'parent_id'])]` on the model
  (not a `$fillable` property).
- **FormRequest per action** (`StoreXRequest`, `UpdateXRequest`) with `rules()`
  and `authorize()`. Scope `unique` rules where needed
  (`unique:departments,name,{$id}`).
- **API Resources** define output; don't return models directly.
- **Standard envelope** for every response via `ApiResponse::success/paginated/error`.
- **Permissions** are named `<module_snake>.<action>` and guarded on routes with
  `->middleware('permission:foo.view')`. Create them for **both** `web` and
  `sanctum` guards (the SPA uses `sanctum`).
- **User-facing strings** go in `App\Constants\ResponseMessage`.
- **Type-hint relationships** (`: BelongsTo`, `: HasMany`).

### Route files

One `routes/modules/<Module>Api.php` per module, auto-loaded. Group with the
right middleware:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/things', [ThingController::class, 'index'])->middleware('permission:thing.view');
    // ...
});
```

Central-only routes add the `central` middleware (and usually `role:Super Admin`).

## Frontend (React / TypeScript)

- **TypeScript, strict.** `npm run typecheck` must pass. No `any` without reason.
- **Module structure** (`modules/<name>/`): `types.ts`, `queries.ts`, `pages/`,
  `components/` drawers, `<name>Slice.ts`. Mirror an existing module.
- **Server state via TanStack Query**; keys are `['<resource>', params]`. Mutations
  invalidate their key so lists refresh.
- **UI/client state via Redux slices**; use the typed `useAppSelector` /
  `useAppDispatch` from `store/hooks`, never the raw react-redux hooks.
- **Server-side tables**: use `useServerTable` + `DataTable` (don't roll your own
  pagination).
- **Forms**: Ant Design `Form`; map server validation errors with
  `applyServerErrors(error, form)` and fall back to `toast.error(serverMessage(...))`.
- **Feedback**: `toast` / `notify` from `utils/toast` (not raw `message.*`).
- **Icons in the sidebar** must be registered in `config/iconRegistry.ts` (string
  name → component); unknown names render no icon.
- **Ant Design 6 note**: `Alert` uses `title` (not the deprecated `message`).

## Comments

Explain *why*, not *what*. Match the existing comment density — this codebase
favors short, load-bearing comments over narration.
