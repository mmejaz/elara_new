import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { App, Form, Input, Modal, Select } from 'antd'
import { useCreateUser } from '../queries'

// Reusable "Add User" form modal. Submits via the useCreateUser mutation and
// surfaces success/error toasts. No real backend — see queries.js.
function AddUserModal({ open, onClose, roleOptions, rolesLoading }) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const mutation = useCreateUser()

  const handleFinish = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        message.success('User created successfully')
        form.resetFields()
        onClose()
      },
      onError: () => {
        message.error('Unable to create user')
      },
    })
  }

  const handleCancel = () => {
    if (mutation.isPending) {
      return
    }

    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="Add User"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Create User"
      confirmLoading={mutation.isPending}
      maskClosable={!mutation.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
        className="!mt-4"
      >
        <Form.Item
          label="Full name"
          name="name"
          rules={[{ required: true, message: 'Enter the user’s name' }]}
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
    </Modal>
  )
}

export default AddUserModal
