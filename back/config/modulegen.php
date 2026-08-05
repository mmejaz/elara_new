<?php

/**
 * Module Generator Configuration
 *
 * Configures ModuleGeneratorService for creating full CRUD scaffolding.
 * See ModuleGeneratorService for error handling and rollback behavior.
 *
 * MARKER SYSTEM:
 * The generator injects code via marker comments in frontend files.
 * These markers MUST exist and should never be removed/renamed:
 *
 * src/store/index.ts:
 *   // __MODULE_REDUCER_IMPORTS__ (imports the reducer)
 *   // __MODULE_REDUCERS__        (registers in configureStore)
 *
 * src/routes/index.tsx:
 *   // __MODULE_ROUTE_DEFS__      (defines route component)
 *   // __MODULE_ROUTES__          (adds to route list)
 */

return [
    /*
     | Absolute path to the React app's src/ directory.
     | Mounted in docker-compose as ./reactTheme:/var/www/reactTheme.
     */
    'frontend_src' => env('MODULEGEN_FRONTEND_SRC', '/var/www/reactTheme/src'),

    /*
     | Permission actions generated for a resourceful module when the request
     | does not specify its own list.
     */
    'default_actions' => ['view', 'create', 'edit', 'delete', 'export'],

    /*
     | Frontend marker comments (CRITICAL - DO NOT MODIFY)
     | If markers are missing or renamed, module generation will fail.
     | These enable safe code injection into generated files.
     |
     | Validation happens before generation starts to prevent partial failures.
     */
    'markers' => [
        'reducer_imports' => '// __MODULE_REDUCER_IMPORTS__',
        'reducers' => '// __MODULE_REDUCERS__',
        'route_defs' => '// __MODULE_ROUTE_DEFS__',
        'routes' => '// __MODULE_ROUTES__',
    ],

    /*
     | Enable strict marker validation
     | When true, generation fails if any marker is missing (recommended)
     | When false, skips missing markers (risky - can cause silent failures)
     */
    'strict_validation' => true,
];
