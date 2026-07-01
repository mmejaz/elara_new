import { Button, Drawer, Form, Input, Skeleton } from 'antd'
import { toast } from '../../../utils/toast'
import { useEffect } from 'react'
import { closeEditDrawer } from '../rolesSlice'
import { useUpdateRole, usePermissions } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import PermissionPicker from './PermissionPicker'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function EditRoleDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.roles.editDrawerOpen)
  const editingRole = useAppSelector((state) => state.roles.editingRole)
  const [form] = Form.useForm()

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
    if (!editingRole) return
    mutation.mutate(
      { id: editingRole.id, ...values },
      {
        onSuccess: () => {
          toast.success('Role updated successfully')
          dispatch(closeEditDrawer())
        },
        onError: (error) => {
          if (!applyServerErrors(error, form)) {
            toast.error(serverMessage(error, 'Unable to update role'))
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
