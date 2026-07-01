import { Button, Drawer, Form, Input, Select } from 'antd'
import { notify, toast } from '../../../utils/toast'
import { closeAddDrawer } from '../permissionsSlice'
import { useCreatePermission } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'manage']

function AddPermissionDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.permissions.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreatePermission()

  const toKey = (text) => text.trim().toLowerCase().replace(/\s+/g, '_')

  const handleFinish = (values) => {
    // "{module}.{action}" with spaces collapsed to underscores.
    const name = `${toKey(values.module)}.${toKey(values.action)}`
    mutation.mutate({ name }, {
      onSuccess: () => {
        notify.success('Permission created', 'The permission was created successfully.')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create permission'))
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
      title="Add New Permission"
      placement="right"
      size="default"
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            Create Permission
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item
          label="Module"
          name="module"
          rules={[{ required: true, message: 'Enter the module name' }]}
          extra="e.g. invoices, products, reports"
        >
          <Input placeholder="e.g. invoices" size="large" />
        </Form.Item>

        <Form.Item
          label="Action"
          name="action"
          rules={[{ required: true, message: 'Select an action' }]}
        >
          <Select
            placeholder="Select action"
            size="large"
            options={ACTIONS.map((a) => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) }))}
          />
        </Form.Item>

        <Form.Item label="Preview" shouldUpdate>
          {({ getFieldValue }) => {
            const action = getFieldValue('action')
            const module = getFieldValue('module')
            if (!action || !module) return null
            return (
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-mono text-gray-700">
                {toKey(module)}.{toKey(action)}
              </div>
            )
          }}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddPermissionDrawer
