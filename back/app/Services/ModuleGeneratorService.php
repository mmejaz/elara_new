<?php

namespace App\Services;

use App\Models\Module;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Writes the full file set for a resourceful module — backend (model,
 * migration, controller, service, requests, resource, routes) and frontend
 * (slice, queries, page, drawers) — plus patches the two central frontend
 * files via marker comments.
 *
 * Every write is tracked so a failure mid-way can be fully rolled back,
 * since filesystem writes are not covered by DB transactions.
 */
class ModuleGeneratorService
{
    private array $createdFiles = [];
    private array $patchedFiles = []; // path => original content

    /** Derived name forms used across every template. */
    private array $n = [];

    public function generate(Module $module): void
    {
        $this->n = $this->names($module->name);

        $this->generateBackend();
        $this->generateFrontend();
        $this->patchFrontendWiring();
    }

    /** Undo everything written/patched so far (called on failure). */
    public function rollback(): void
    {
        foreach ($this->createdFiles as $path) {
            if (File::exists($path)) {
                File::delete($path);
            }
        }

        foreach ($this->patchedFiles as $path => $original) {
            File::put($path, $original);
        }

        $this->createdFiles = [];
        $this->patchedFiles = [];
    }

    /** The migration table name, exposed so the caller can run/rollback migrate. */
    public function tableName(): string
    {
        return $this->n['table'] ?? '';
    }

    // ─────────────────────────────────────────────────────────── naming ────

    private function names(string $name): array
    {
        $singular = Str::studly(Str::singular(trim($name))); // Student
        $plural   = Str::pluralStudly($singular);            // Students

        return [
            'singular'    => $singular,                       // Student
            'plural'      => $plural,                         // Students
            'table'       => Str::snake($plural),             // students
            'slug'        => Str::slug($plural),              // students  (route + module slug + perm)
            'camel'       => Str::camel($singular),           // student
            'camelPlural' => Str::camel($plural),             // students
            'titlePlural' => Str::headline($plural),          // Students
            'titleSingular' => Str::headline($singular),      // Student
            'permKey'     => Str::snake(trim($name)),         // user_info (matches Module::permissionNames)
        ];
    }

    // ───────────────────────────────────────────────────────── backend ────

    private function generateBackend(): void
    {
        $n = $this->n;

        // Model
        $this->put(base_path("app/Models/{$n['singular']}.php"), <<<PHP
        <?php

        namespace App\Models;

        use Illuminate\Database\Eloquent\Attributes\Fillable;
        use Illuminate\Database\Eloquent\Model;

        #[Fillable(['name'])]
        class {$n['singular']} extends Model
        {
        }
        PHP);

        // Migration
        $timestamp = date('Y_m_d_His');
        $this->put(base_path("database/migrations/{$timestamp}_create_{$n['table']}_table.php"), <<<PHP
        <?php

        use Illuminate\Database\Migrations\Migration;
        use Illuminate\Database\Schema\Blueprint;
        use Illuminate\Support\Facades\Schema;

        return new class extends Migration
        {
            public function up(): void
            {
                Schema::create('{$n['table']}', function (Blueprint \$table) {
                    \$table->id();
                    \$table->string('name');
                    \$table->timestamps();
                });
            }

            public function down(): void
            {
                Schema::dropIfExists('{$n['table']}');
            }
        };
        PHP);

        // Resource
        $this->put(base_path("app/Http/Resources/{$n['singular']}Resource.php"), <<<PHP
        <?php

        namespace App\Http\Resources;

        use Illuminate\Http\Request;
        use Illuminate\Http\Resources\Json\JsonResource;

        class {$n['singular']}Resource extends JsonResource
        {
            public function toArray(Request \$request): array
            {
                return [
                    'id'         => \$this->id,
                    'name'       => \$this->name,
                    'created_at' => \$this->created_at?->toDateString(),
                ];
            }
        }
        PHP);

        // Form Requests
        $this->put(base_path("app/Http/Requests/{$n['singular']}/Store{$n['singular']}Request.php"), <<<PHP
        <?php

        namespace App\Http\Requests\\{$n['singular']};

        use Illuminate\Foundation\Http\FormRequest;

        class Store{$n['singular']}Request extends FormRequest
        {
            public function authorize(): bool
            {
                return true;
            }

            public function rules(): array
            {
                return [
                    'name' => ['required', 'string', 'max:255', 'unique:{$n['table']},name'],
                ];
            }
        }
        PHP);

        $this->put(base_path("app/Http/Requests/{$n['singular']}/Update{$n['singular']}Request.php"), <<<PHP
        <?php

        namespace App\Http\Requests\\{$n['singular']};

        use Illuminate\Foundation\Http\FormRequest;

        class Update{$n['singular']}Request extends FormRequest
        {
            public function authorize(): bool
            {
                return true;
            }

            public function rules(): array
            {
                \$id = \$this->route('{$n['camel']}')->id;

                return [
                    'name' => ['required', 'string', 'max:255', 'unique:{$n['table']},name,' . \$id],
                ];
            }
        }
        PHP);

        // Service
        $this->put(base_path("app/Services/{$n['singular']}Service.php"), <<<PHP
        <?php

        namespace App\Services;

        use App\Http\Resources\\{$n['singular']}Resource;
        use App\Models\\{$n['singular']};
        use Illuminate\Support\Facades\DB;

        class {$n['singular']}Service
        {
            public function getAll()
            {
                return {$n['singular']}Resource::collection(
                    {$n['singular']}::latest()->get()
                );
            }

            public function create(array \$data): {$n['singular']}Resource
            {
                return DB::transaction(function () use (\$data) {
                    \$record = {$n['singular']}::create(['name' => \$data['name']]);

                    return new {$n['singular']}Resource(\$record);
                });
            }

            public function update({$n['singular']} \${$n['camel']}, array \$data): {$n['singular']}Resource
            {
                return DB::transaction(function () use (\${$n['camel']}, \$data) {
                    \${$n['camel']}->update(['name' => \$data['name']]);

                    return new {$n['singular']}Resource(\${$n['camel']});
                });
            }

            public function delete({$n['singular']} \${$n['camel']}): void
            {
                DB::transaction(fn () => \${$n['camel']}->delete());
            }
        }
        PHP);

        // Controller
        $this->put(base_path("app/Http/Controllers/{$n['singular']}Controller.php"), <<<PHP
        <?php

        namespace App\Http\Controllers;

        use App\Constants\ResponseMessage;
        use App\Helpers\ApiResponse;
        use App\Http\Requests\\{$n['singular']}\Store{$n['singular']}Request;
        use App\Http\Requests\\{$n['singular']}\Update{$n['singular']}Request;
        use App\Models\\{$n['singular']};
        use App\Services\\{$n['singular']}Service;
        use Symfony\Component\HttpFoundation\Response;

        class {$n['singular']}Controller extends Controller
        {
            public function __construct(private {$n['singular']}Service \$service) {}

            public function index()
            {
                return ApiResponse::success(\$this->service->getAll(), ResponseMessage::FETCHED);
            }

            public function store(Store{$n['singular']}Request \$request)
            {
                return ApiResponse::success(
                    \$this->service->create(\$request->validated()),
                    ResponseMessage::CREATED,
                    Response::HTTP_CREATED,
                );
            }

            public function update(Update{$n['singular']}Request \$request, {$n['singular']} \${$n['camel']})
            {
                return ApiResponse::success(
                    \$this->service->update(\${$n['camel']}, \$request->validated()),
                    ResponseMessage::UPDATED,
                );
            }

            public function destroy({$n['singular']} \${$n['camel']})
            {
                \$this->service->delete(\${$n['camel']});

                return ApiResponse::success(null, ResponseMessage::DELETED);
            }
        }
        PHP);

        // Routes (own file, auto-loaded)
        $this->put(base_path("routes/modules/{$n['singular']}Api.php"), <<<PHP
        <?php

        use Illuminate\Support\Facades\Route;
        use App\Http\Controllers\\{$n['singular']}Controller;

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/{$n['slug']}', [{$n['singular']}Controller::class, 'index'])->middleware('permission:{$n['permKey']}.view');
            Route::post('/{$n['slug']}', [{$n['singular']}Controller::class, 'store'])->middleware('permission:{$n['permKey']}.create');
            Route::put('/{$n['slug']}/{{$n['camel']}}', [{$n['singular']}Controller::class, 'update'])->middleware('permission:{$n['permKey']}.edit');
            Route::delete('/{$n['slug']}/{{$n['camel']}}', [{$n['singular']}Controller::class, 'destroy'])->middleware('permission:{$n['permKey']}.delete');
        });
        PHP);
    }

    // ──────────────────────────────────────────────────────── frontend ────

    private function generateFrontend(): void
    {
        $n = $this->n;
        $src = rtrim(config('modulegen.frontend_src'), '/');

        // Entity type
        $this->put("{$src}/modules/{$n['slug']}/types.ts", <<<TS
        export interface {$n['singular']} {
          id: number
          name: string
          created_at: string
        }
        TS);

        // Redux slice (drawer state only)
        $this->put("{$src}/modules/{$n['slug']}/{$n['camelPlural']}Slice.ts", <<<TS
        import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
        import type { {$n['singular']} } from './types'

        interface {$n['plural']}UiState {
          addDrawerOpen: boolean
          editDrawerOpen: boolean
          editing: {$n['singular']} | null
        }

        const initialState: {$n['plural']}UiState = {
          addDrawerOpen: false,
          editDrawerOpen: false,
          editing: null,
        }

        const {$n['camelPlural']}Slice = createSlice({
          name: '{$n['camelPlural']}',
          initialState,
          reducers: {
            openAddDrawer: (state) => {
              state.addDrawerOpen = true
            },
            closeAddDrawer: (state) => {
              state.addDrawerOpen = false
            },
            openEditDrawer: (state, action: PayloadAction<{$n['singular']}>) => {
              state.editing = action.payload
              state.editDrawerOpen = true
            },
            closeEditDrawer: (state) => {
              state.editDrawerOpen = false
              state.editing = null
            },
          },
        })

        export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
          {$n['camelPlural']}Slice.actions
        export default {$n['camelPlural']}Slice.reducer
        TS);

        // Query hooks
        $this->put("{$src}/modules/{$n['slug']}/queries.ts", <<<TS
        import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
        import apiClient from '../../services/apiClient'
        import type { {$n['singular']} } from './types'

        async function fetch{$n['plural']}(): Promise<{$n['singular']}[]> {
          const { data } = await apiClient.get('/{$n['slug']}')
          return data.data
        }

        export function use{$n['plural']}() {
          return useQuery({ queryKey: ['{$n['slug']}'], queryFn: fetch{$n['plural']} })
        }

        export function useCreate{$n['singular']}() {
          const queryClient = useQueryClient()
          return useMutation({
            mutationFn: (values: Record<string, unknown>) => apiClient.post('/{$n['slug']}', values),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['{$n['slug']}'] }),
          })
        }

        export function useUpdate{$n['singular']}() {
          const queryClient = useQueryClient()
          return useMutation({
            mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
              apiClient.put(`/{$n['slug']}/\${id}`, values),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['{$n['slug']}'] }),
          })
        }

        export function useDelete{$n['singular']}() {
          const queryClient = useQueryClient()
          return useMutation({
            mutationFn: (id: number) => apiClient.delete(`/{$n['slug']}/\${id}`),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['{$n['slug']}'] }),
          })
        }
        TS);

        // List page
        $this->put("{$src}/modules/{$n['slug']}/pages/{$n['plural']}Page.tsx", <<<TSX
        import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
        import { Button, Card, Popconfirm, Space, Table, Tooltip, Typography } from 'antd'
        import type { ColumnsType } from 'antd/es/table'
        import { useMemo } from 'react'
        import PageHeader from '../../../components/PageHeader'
        import Add{$n['singular']}Drawer from '../components/Add{$n['singular']}Drawer'
        import Edit{$n['singular']}Drawer from '../components/Edit{$n['singular']}Drawer'
        import { openAddDrawer, openEditDrawer } from '../{$n['camelPlural']}Slice'
        import { use{$n['plural']}, useDelete{$n['singular']} } from '../queries'
        import { useAppDispatch } from '../../../store/hooks'
        import { toast } from '../../../utils/toast'
        import type { {$n['singular']} } from '../types'

        const { Text } = Typography

        function {$n['plural']}Page() {
          const dispatch = useAppDispatch()
          const { data: rows = [], isLoading } = use{$n['plural']}()
          const remove = useDelete{$n['singular']}()

          const handleDelete = (id: number) =>
            remove.mutate(id, {
              onSuccess: () => toast.success('Deleted'),
              onError: () => toast.error('Unable to delete'),
            })

          const columns = useMemo<ColumnsType<{$n['singular']}>>(
            () => [
              { title: 'Name', dataIndex: 'name', render: (name) => <Text strong>{name}</Text> },
              {
                title: 'Actions',
                key: 'actions',
                width: 120,
                render: (_, record) => (
                  <Space>
                    <Tooltip title="Edit">
                      <Button type="text" icon={<EditOutlined />} onClick={() => dispatch(openEditDrawer(record))} />
                    </Tooltip>
                    <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.id)}>
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ],
            [dispatch],
          )

          return (
            <Space orientation="vertical" size={16} className="w-full">
              <PageHeader
                title="{$n['titlePlural']}"
                subtitle="Manage {$n['titlePlural']} records."
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
                    Add {$n['titleSingular']}
                  </Button>
                }
              />
              <Card styles={{ body: { padding: 18 } }}>
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={rows}
                  loading={isLoading}
                  pagination={{ pageSize: 15, showSizeChanger: false }}
                  scroll={{ x: true }}
                />
              </Card>
              <Add{$n['singular']}Drawer />
              <Edit{$n['singular']}Drawer />
            </Space>
          )
        }

        export default {$n['plural']}Page
        TSX);

        // Add drawer
        $this->put("{$src}/modules/{$n['slug']}/components/Add{$n['singular']}Drawer.tsx", <<<TSX
        import { Button, Drawer, Form, Input } from 'antd'
        import { closeAddDrawer } from '../{$n['camelPlural']}Slice'
        import { useCreate{$n['singular']} } from '../queries'
        import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
        import { notify, toast } from '../../../utils/toast'
        import { useAppDispatch, useAppSelector } from '../../../store/hooks'

        function Add{$n['singular']}Drawer() {
          const dispatch = useAppDispatch()
          const open = useAppSelector((state) => state.{$n['camelPlural']}.addDrawerOpen)
          const [form] = Form.useForm()
          const mutation = useCreate{$n['singular']}()

          const handleFinish = (values: Record<string, unknown>) => {
            mutation.mutate(values, {
              onSuccess: () => {
                notify.success('{$n['titleSingular']} created', 'The record was created successfully.')
                form.resetFields()
                dispatch(closeAddDrawer())
              },
              onError: (error) => {
                if (!applyServerErrors(error, form)) {
                  toast.error(serverMessage(error, 'Unable to create'))
                }
              },
            })
          }

          const handleClose = () => {
            if (mutation.isPending) return
            form.resetFields()
            dispatch(closeAddDrawer())
          }

          return (
            <Drawer
              title="Add {$n['titleSingular']}"
              placement="right"
              size={480}
              open={open}
              onClose={handleClose}
              maskClosable={!mutation.isPending}
              destroyOnHidden
              footer={
                <div className="flex justify-end gap-2">
                  <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
                  <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>Create</Button>
                </div>
              }
            >
              <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
                  <Input placeholder="Enter name" size="large" autoFocus />
                </Form.Item>
              </Form>
            </Drawer>
          )
        }

        export default Add{$n['singular']}Drawer
        TSX);

        // Edit drawer
        $this->put("{$src}/modules/{$n['slug']}/components/Edit{$n['singular']}Drawer.tsx", <<<TSX
        import { Button, Drawer, Form, Input } from 'antd'
        import { useEffect } from 'react'
        import { closeEditDrawer } from '../{$n['camelPlural']}Slice'
        import { useUpdate{$n['singular']} } from '../queries'
        import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
        import { toast } from '../../../utils/toast'
        import { useAppDispatch, useAppSelector } from '../../../store/hooks'

        function Edit{$n['singular']}Drawer() {
          const dispatch = useAppDispatch()
          const open = useAppSelector((state) => state.{$n['camelPlural']}.editDrawerOpen)
          const editing = useAppSelector((state) => state.{$n['camelPlural']}.editing)
          const [form] = Form.useForm()
          const mutation = useUpdate{$n['singular']}()

          useEffect(() => {
            if (editing) form.setFieldsValue({ name: editing.name })
          }, [editing, form])

          const handleFinish = (values: Record<string, unknown>) => {
            if (!editing) return
            mutation.mutate({ id: editing.id, ...values }, {
              onSuccess: () => {
                toast.success('{$n['titleSingular']} updated')
                dispatch(closeEditDrawer())
              },
              onError: (error) => {
                if (!applyServerErrors(error, form)) {
                  toast.error(serverMessage(error, 'Unable to update'))
                }
              },
            })
          }

          const handleClose = () => {
            if (mutation.isPending) return
            dispatch(closeEditDrawer())
          }

          return (
            <Drawer
              title="Edit {$n['titleSingular']}"
              placement="right"
              size={480}
              open={open}
              onClose={handleClose}
              maskClosable={!mutation.isPending}
              destroyOnHidden
              footer={
                <div className="flex justify-end gap-2">
                  <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
                  <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>Save</Button>
                </div>
              }
            >
              <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
                  <Input placeholder="Enter name" size="large" autoFocus />
                </Form.Item>
              </Form>
            </Drawer>
          )
        }

        export default Edit{$n['singular']}Drawer
        TSX);
    }

    // ───────────────────────────────────────────────── wiring patches ────

    private function patchFrontendWiring(): void
    {
        $n = $this->n;
        $src = rtrim(config('modulegen.frontend_src'), '/');

        // Register the reducer in store/index.ts
        $storeIndex = "{$src}/store/index.ts";
        $this->patch($storeIndex, '// __MODULE_REDUCER_IMPORTS__',
            "import {$n['camelPlural']}Reducer from '../modules/{$n['slug']}/{$n['camelPlural']}Slice'\n// __MODULE_REDUCER_IMPORTS__");
        $this->patch($storeIndex, '// __MODULE_REDUCERS__',
            "{$n['camelPlural']}: {$n['camelPlural']}Reducer,\n    // __MODULE_REDUCERS__");

        // Register the TanStack route in routes/index.tsx
        $routes = "{$src}/routes/index.tsx";
        $this->patch($routes, '// __MODULE_ROUTE_DEFS__',
            "const {$n['plural']}Page = lazy(() => import('../modules/{$n['slug']}/pages/{$n['plural']}Page'))\n"
          . "const {$n['camelPlural']}Route = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/{$n['slug']}', component: {$n['plural']}Page })\n"
          . "// __MODULE_ROUTE_DEFS__");
        $this->patch($routes, '// __MODULE_ROUTES__',
            "{$n['camelPlural']}Route,\n    // __MODULE_ROUTES__");
    }

    // ───────────────────────────────────────────────────────── helpers ────

    /** Write a file (dedenting the heredoc), creating dirs, tracking for rollback. */
    private function put(string $path, string $content): void
    {
        $dir = dirname($path);
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true, true);
        }

        File::put($path, $this->dedent($content) . "\n");
        $this->createdFiles[] = $path;
    }

    /** Inject a snippet at a marker, snapshotting original content for rollback. */
    private function patch(string $path, string $marker, string $replacement): void
    {
        $content = File::get($path);

        if (! str_contains($content, $marker)) {
            throw new \RuntimeException("Marker not found in {$path}: {$marker}");
        }

        if (! isset($this->patchedFiles[$path])) {
            $this->patchedFiles[$path] = $content;
        }

        File::put($path, str_replace($marker, $replacement, $content));
    }

    /** Strip the leading indentation the heredoc inherits from this method body. */
    private function dedent(string $text): string
    {
        $lines = explode("\n", $text);
        $indent = null;

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }
            preg_match('/^(\s*)/', $line, $m);
            $len = strlen($m[1]);
            $indent = $indent === null ? $len : min($indent, $len);
        }

        if (! $indent) {
            return $text;
        }

        return implode("\n", array_map(
            fn ($line) => substr($line, $indent) ?: ltrim($line),
            $lines,
        ));
    }
}
