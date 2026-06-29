import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Form, Input, Select } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { closeAddDrawer } from '../../../store/usersSlice'
import { useCreateUser, useRoles } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'

function AddUserDrawer() {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.users.addDrawerOpen)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const roleOptions = roles.map((role) => ({ value: role, label: role }))
  const mutation = useCreateUser()

  const handleFinish = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        message.success('User created successfully')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          message.error(serverMessage(error, 'Unable to create user'))
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
      </Form>
    </Drawer>
  )
}

export default AddUserDrawer
