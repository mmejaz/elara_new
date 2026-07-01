import { Button, Drawer, Form, Input, Skeleton } from 'antd'
import { notify, toast } from '../../../utils/toast'
import { closeAddDrawer } from '../rolesSlice'
import { useCreateRole, usePermissions } from '../queries'
import PermissionPicker from './PermissionPicker'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function AddRoleDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.roles.addDrawerOpen)
  const [form] = Form.useForm()

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const mutation = useCreateRole()

  const handleFinish = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        notify.success('Role created', 'The role was created successfully.')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create role'))
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
      title="Add New Role"
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
            Create Role
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
        initialValues={{ permissions: [] }}
      >
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

export default AddRoleDrawer
