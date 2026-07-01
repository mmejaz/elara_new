import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Alert, Button, Checkbox, Divider, Form, Input, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AuthPanel from '../components/AuthPanel'
import { login } from '../../../store/authSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth)
  const [form] = Form.useForm()

  useEffect(() => {
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      form.setFields(
        Object.entries(fieldErrors).map(([field, messages]) => ({
          name: field,
          errors: Array.isArray(messages) ? messages : [messages],
        })),
      )
    }
  }, [fieldErrors, form])

  const handleSubmit = async (values) => {
    const result = await dispatch(login({ email: values.email, password: values.password }))
    if (login.fulfilled.match(result)) {
      navigate({ to: '/dashboard', replace: true })
    }
  }

  return (
    <AuthPanel
      title="Welcome Back"
      subtitle="Enter your email and password to access your account."
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
      >
        {error && Object.keys(fieldErrors ?? {}).length === 0 && (
          <Alert
            title={error}
            type="error"
            showIcon
            className="!mb-5 !rounded-lg !text-[13px]"
          />
        )}

        <Form.Item
          className="!mb-6 max-sm:!mb-5 [&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-label>label]:!text-[13px] [&_.ant-form-item-label>label]:!font-medium [&_.ant-form-item-label>label]:!text-[#080808]"
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Enter your email' }]}
        >
          <Input
            autoComplete="email"
            className="!min-h-[42px] !rounded-lg !border-0 !bg-[#f4f4f6] !text-[13px] !text-[#111111] !shadow-none hover:!bg-[#f1f1f4] focus:!bg-[#f1f1f4] [&_.ant-input-prefix]:!mr-2.5 [&_.ant-input-prefix]:!text-[#8b8b92] [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[13px]"
            placeholder="Enter your email"
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          className="!mb-6 max-sm:!mb-5 [&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-label>label]:!text-[13px] [&_.ant-form-item-label>label]:!font-medium [&_.ant-form-item-label>label]:!text-[#080808]"
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Enter your password' }]}
        >
          <Input.Password
            autoComplete="current-password"
            className="!min-h-[42px] !rounded-lg !border-0 !bg-[#f4f4f6] !text-[13px] !text-[#111111] !shadow-none hover:!bg-[#f1f1f4] focus-within:!bg-[#f1f1f4] [&_.ant-input-prefix]:!mr-2.5 [&_.ant-input-prefix]:!text-[#8b8b92] [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[13px]"
            placeholder="Enter your password"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>

        <div className="-mt-2.5 mb-7 flex items-center justify-between gap-4 max-md:mb-6 max-sm:flex-col max-sm:items-start max-sm:gap-2 [&_.ant-checkbox-wrapper]:!text-xs [&_.ant-checkbox-wrapper]:!text-[#111111] [&_.ant-typography]:!text-xs [&_.ant-typography]:!text-[#111111]">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Typography.Link
            onClick={(event) => {
              event.preventDefault()
              navigate({ to: '/forgot-password' })
            }}
          >
            Forgot password?
          </Typography.Link>
        </div>

        <Button
          block
          className="!mt-0 !h-[42px] !rounded-lg !bg-[#050505] !text-[13px] !font-semibold !shadow-none hover:!bg-[#202020]"
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
        >
          Sign in
        </Button>

        <Divider plain className="!my-2.5 !text-xs !text-[#a2a2a8]">
          or
        </Divider>

        <div className="flex min-h-[42px] items-center justify-center rounded-lg bg-[#f3fbf7] px-3 text-center font-serif text-xs font-medium leading-snug text-[#145c3d] shadow-[0_6px_18px_rgba(20,92,61,0.06)]">
          <SafetyCertificateOutlined className="mr-2 shrink-0 text-base !text-[#18a058]" />
          <span>Protected by Secure Sign-in</span>
        </div>
      </Form>
    </AuthPanel>
  )
}

export default Login
