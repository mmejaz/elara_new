import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Drawer, Form, Input, Select, Skeleton } from 'antd'
import { notify, toast } from '../../../utils/toast'
import { closeAddDrawer } from '../usersSlice'
import { useCreateUser, usePermissions, useRolesDetailed } from '../queries'
import { useOrganizationOptions } from '../../organizations/queries'
import PermissionPicker from '../../roles/components/PermissionPicker'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function AddUserDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.users.addDrawerOpen)
  const [form] = Form.useForm()

  const { data: roles = [], isLoading: rolesLoading } = useRolesDetailed()
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizationOptions()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const roleOptions = roles.map((role) => ({ value: role.name, label: role.name }))
  const mutation = useCreateUser()

  // When a role is picked, preview the permissions it grants (read-only).
  const selectedRoleName = Form.useWatch('role', form)
  const selectedRole = roles.find((role) => role.name === selectedRoleName)
  const rolePermissions = selectedRole?.permissions ?? []

  const handleFinish = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        notify.success('User created', 'The user account was created successfully.')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create user'))
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
      title="Add New User"
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
            Create User
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Enter the user's name" }]}
        >
          <Input
            autoComplete="off"
            placeholder="Jane Doe"
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
        >
          <Input
            autoComplete="off"
            placeholder="jane@example.com"
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Enter a password' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Select a role' }]}
        >
          <Select
            loading={rolesLoading}
            options={roleOptions}
            placeholder="Select a role"
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Organizations"
          name="organization_ids"
          rules={[{ required: true, message: 'Assign at least one organization' }]}
          tooltip="Every user must belong to at least one organization. A Super Admin still sees all organizations regardless of assignment."
        >
          <Select
            mode="multiple"
            loading={orgsLoading}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            placeholder="Assign at least one organization"
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        {selectedRoleName && (
          <Form.Item
            label={
              <span className="font-medium">
                Access from this role
                <span className="ml-1 text-xs font-normal text-gray-400">
                  — permissions granted, by module
                </span>
              </span>
            }
          >
            {permissionsLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <PermissionPicker permissions={permissions} value={rolePermissions} disabled />
            )}
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}

export default AddUserDrawer
