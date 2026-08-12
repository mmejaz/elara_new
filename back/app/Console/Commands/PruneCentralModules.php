<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Module;
use App\Models\Tenant;
use Illuminate\Console\Command;

/**
 * Removes central-only modules (config/central.php) from tenant databases that
 * were provisioned before those modules were excluded from the seeder.
 *
 * ModuleSeeder now skips them for new tenants, so this is a one-off catch-up for
 * existing ones. Safe to re-run — it deletes only what is already absent from
 * the seeder's tenant output.
 */
class PruneCentralModules extends Command
{
    protected $signature = 'modules:prune-central {--tenant=* : Limit to specific tenant ids}';

    protected $description = 'Remove central-only modules (tenants, module-builder) from tenant databases';

    public function handle(): int
    {
        $central = config('central.modules', []);

        if ($central === []) {
            $this->warn('config/central.modules is empty — nothing to prune.');

            return self::SUCCESS;
        }

        $tenants = $this->option('tenant')
            ? Tenant::whereIn('id', $this->option('tenant'))->get()
            : Tenant::all();

        if ($tenants->isEmpty()) {
            $this->warn('No tenants found.');

            return self::SUCCESS;
        }

        $this->info(sprintf('Pruning [%s] from %d tenant(s).', implode(', ', $central), $tenants->count()));

        foreach ($tenants as $tenant) {
            $tenant->run(function () use ($tenant, $central): void {
                // The global scope hides these rows by design, so it has to be
                // lifted here — otherwise there is nothing to delete.
                $deleted = Module::withoutGlobalScope('central_only')
                    ->whereIn('slug', $central)
                    ->forceDelete();

                $this->line("  {$tenant->id}: removed {$deleted} module(s)");
            });
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}
