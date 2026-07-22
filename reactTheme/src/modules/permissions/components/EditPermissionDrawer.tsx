import { Button, Drawer, Form, Input, Select } from 'antd'
import { toast } from '../../../utils/toast'
import { useEffect } from 'react'
import { closeEditDrawer } from '../permissionsSlice'
import { useUpdatePermission } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'manage']

function EditPermissionDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.permissions.editDrawerOpen)
  const editingPermission = useAppSelector((state) => state.permissions.editingPermission)
  const [form] = Form.useForm()
  const mutation = useUpdatePermission()

  const toKey = (text) => text.trim().toLowerCase().replace(/\s+/g, '_')

  useEffect(() => {
    if (open && editingPermission) {
      // "{module}.{action}" → fields (underscores shown as spaces for editing).
      const [module = '', action = ''] = editingPermission.name.split('.')
      form.setFieldsValue({
        action,
        module: module.replace(/_/g, ' '),
      })
    }
  }, [open, editingPermission, form])

  const handleFinish = (values) => {
    if (!editingPermission) return
    const name = `${toKey(values.module)}.${toKey(values.action)}`
    mutation.mutate({ id: editingPermission.id, name }, {
      onSuccess: () => {
        toast.success('Permission updated successfully')
        dispatch(closeEditDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to update permission'))
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
