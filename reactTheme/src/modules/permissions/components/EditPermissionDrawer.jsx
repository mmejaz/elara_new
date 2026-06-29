import { App, Button, Drawer, Form, Input, Select } from 'antd'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeEditDrawer } from '../../../store/permissionsSlice'
import { useUpdatePermission } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'manage']

function EditPermissionDrawer() {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.permissions.editDrawerOpen)
  const editingPermission = useSelector((state) => state.permissions.editingPermission)
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const mutation = useUpdatePermission()

  useEffect(() => {
    if (open && editingPermission) {
      const parts = editingPermission.name.split(' ')
      form.setFieldsValue({
        action: parts[0],
        module: parts.slice(1).join(' '),
      })
    }
  }, [open, editingPermission, form])

  const handleFinish = (values) => {
    const name = `${values.action} ${values.module.trim().toLowerCase()}`
    mutation.mutate({ id: editingPermission.id, name }, {
      onSuccess: () => {
        message.success('Permission updated successfully')
        dispatch(closeEditDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          message.error(serverMessage(error, 'Unable to update permission'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    dispatch(closeEditDrawer())
  }

  return (
    <Drawer
      title={`Edit Permission — ${editingPermission?.name ?? ''}`}
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
            Save Changes
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item
          label="Module"
          name="module"
          rules={[{ required: true, message: 'Enter the module name' }]}
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
                {action} {module.trim().toLowerCase()}
              </div>
            )
          }}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditPermissionDrawer
