import { App, Button, Drawer, Form, Input, Skeleton } from 'antd'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeEditDrawer } from '../../../store/rolesSlice'
import { useUpdateRole, usePermissions } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import PermissionPicker from './PermissionPicker'

function EditRoleDrawer() {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.roles.editDrawerOpen)
  const editingRole = useSelector((state) => state.roles.editingRole)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const mutation = useUpdateRole()

  useEffect(() => {
    if (open && editingRole) {
      form.setFieldsValue({
        name: editingRole.name,
        permissions: editingRole.permissions ?? [],
      })
    }
  }, [open, editingRole, form])

  const handleFinish = (values) => {
    mutation.mutate(
      { id: editingRole.id, ...values },
      {
        onSuccess: () => {
          message.success('Role updated successfully')
          dispatch(closeEditDrawer())
        },
        onError: (error) => {
          if (!applyServerErrors(error, form)) {
            message.error(serverMessage(error, 'Unable to update role'))
          }
        },
      },
    )
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    dispatch(closeEditDrawer())
  }

  return (
    <Drawer
      title={`Edit Role — ${editingRole?.name ?? ''}`}
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={mutation.isPending}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item
          label="Role Name"
          name="name"
          rules={[{ required: true, message: 'Enter a role name' }]}
        >
          <Input placeholder="e.g. Accountant" size="large" />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-medium">
              Permissions
              <span className="ml-1 text-xs font-normal text-gray-400">
                — expand a module to select
              </span>
            </span>
          }
          name="permissions"
        >
          {permissionsLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <PermissionPicker permissions={permissions} />
          )}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditRoleDrawer
