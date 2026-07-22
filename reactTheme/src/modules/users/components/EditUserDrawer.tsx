import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Drawer, Form, Input, Select } from 'antd'
import { useEffect } from 'react'
import { closeEditDrawer } from '../usersSlice'
import { useRoles, useUpdateUser } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function EditUserDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.users.editDrawerOpen)
  const editingUser = useAppSelector((state) => state.users.editingUser)
  const [form] = Form.useForm()
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const roleOptions = roles.map((role: string) => ({ value: role, label: role }))
  const mutation = useUpdateUser()

  useEffect(() => {
    if (open && editingUser) {
      form.setFieldsValue({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.roles?.[0],
        password: '',
      })
    }
  }, [open, editingUser, form])

  const handleFinish = (values: Record<string, unknown>) => {
    if (!editingUser) return
    mutation.mutate(
      { id: editingUser.id, ...values },
      {
        onSuccess: () => {
          toast.success('User updated successfully')
          dispatch(closeEditDrawer())
        },
        onError: (error) => {
          if (!applyServerErrors(error, form)) {
            toast.error(serverMessage(error, 'Unable to update user'))
          }
        },
      },
    )
  }

  const handleClose = () => {
    if (mutation.isPending) return
    dispatch(closeEditDrawer())
  }

  return (
    <Drawer
      title="Edit User"
      placement="right"
      size={480}
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
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Enter the user's name" }]}
        >
          <Input autoComplete="off" placeholder="Jane Doe" prefix={<UserOutlined />} size="large" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
        >
          <Input autoComplete="off" placeholder="jane@example.com" prefix={<MailOutlined />} size="large" />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="password"
          extra="Leave blank to keep the current password."
          rules={[{ min: 8, message: 'Password must be at least 8 characters' }]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder="Leave blank to keep unchanged"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Select a role' }]}>
          <Select
            loading={rolesLoading}
            options={roleOptions}
            placeholder="Select a role"
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditUserDrawer
