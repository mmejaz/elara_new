<?php

return [
    /*
     | Absolute path (inside the backend container) to the React app's src/.
     | Mounted in docker-compose as ./reactTheme:/var/www/reactTheme.
     */
    'frontend_src' => env('MODULEGEN_FRONTEND_SRC', '/var/www/reactTheme/src'),

    /*
     | Permission actions generated for a resourceful module when the request
     | does not specify its own list.
     */
    'default_actions' => ['view', 'create', 'edit', 'delete', 'export'],
];
