import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Typography } from 'antd'
import { toast } from '../../../utils/toast'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AuthPanel from '../components/AuthPanel'
import SecureBadge from '../components/SecureBadge'
import { authFormItem, authInput, authSubmitButton } from '../authStyles'

// Placeholder forgot-password flow — no real email is sent.
function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Password reset instructions would be sent (demo)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPanel
      title="Forgot password"
      subtitle="We will send password reset instructions to your email."
      footerText="Remembered your password?"
      footerActionText="Sign in"
      footerAction={() => navigate({ to: '/login' })}
    >
      <Form layout="vertical" requiredMark={false} onFinish={handleSubmit}>
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

        <Button
          block
          className={authSubmitButton}
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
        >
          Send reset link
        </Button>

        <Typography.Link
          className="!mt-5 flex items-center justify-center gap-2 !text-xs !font-semibold !text-[#111111] dark:!text-slate-200"
          onClick={() => navigate({ to: '/login' })}
        >
          <ArrowLeftOutlined className="text-[11px]" />
          Back to login
        </Typography.Link>

        <SecureBadge className="!mt-6" />
      </Form>
    </AuthPanel>
  )
}

export default ForgotPassword
