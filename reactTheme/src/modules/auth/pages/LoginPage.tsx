import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { Alert, Button, Checkbox, Divider, Form, Input, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AuthPanel from '../components/AuthPanel'
import SecureBadge from '../components/SecureBadge'
import {
  authFormItem,
  authInput,
  authPasswordIcon,
  authSubmitButton,
} from '../authStyles'
import { login } from '../../../store/authSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

interface LoginValues {
  email: string
  password: string
  remember: boolean
}

function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth)
  // Untyped form: setFields() below maps arbitrary server-side error keys,
  // which a generic form would reject. handleSubmit is typed instead.
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

  const handleSubmit = async (values: LoginValues) => {
    const result = await dispatch(
      login({ email: values.email, password: values.password }),
    )
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
          className={authFormItem}
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Enter your email' }]}
        >
          <Input
            autoComplete="email"
            autoFocus
            className={authInput}
            placeholder="Enter your email"
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          className={authFormItem}
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Enter your password' }]}
        >
          <Input.Password
            autoComplete="current-password"
            className={`${authInput} ${authPasswordIcon}`}
            placeholder="Enter your password"
            prefix={<LockOutlined />}
            // Default toggle is a tiny, faint 13px glyph that's easy to miss.
            // Render explicit eye / eye-off icons; authPasswordIcon enlarges
            // them and lifts the contrast so it reads clearly as a control.
            iconRender={(visible) =>
              visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
            }
            size="large"
          />
        </Form.Item>

        <div className="-mt-2 mb-5 flex items-center justify-between gap-4 max-md:mb-6 max-sm:flex-col max-sm:items-start max-sm:gap-2 [&_.ant-checkbox-wrapper]:!text-xs [&_.ant-checkbox-wrapper]:!text-[#111111] dark:[&_.ant-checkbox-wrapper]:!text-slate-300 [&_.ant-typography]:!text-xs [&_.ant-typography]:!text-[#111111]">
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
          className={authSubmitButton}
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
        >
          Sign in
        </Button>

        <Divider plain className="!my-2.5 !text-xs !text-[#a2a2a8] dark:!text-slate-500">
          or
        </Divider>

        <SecureBadge />
      </Form>
    </AuthPanel>
  )
}

export default Login
