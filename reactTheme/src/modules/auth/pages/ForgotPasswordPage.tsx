import {
  ArrowLeftOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, Typography } from 'antd'
import { toast } from '../../../utils/toast'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import AuthPanel from '../components/AuthPanel'

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

        <Button
          block
          className="!mt-0 !h-[42px] !rounded-lg !bg-[#050505] !text-[13px] !font-semibold !shadow-none hover:!bg-[#202020]"
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
        >
          Send reset link
        </Button>

        <Typography.Link
          className="!mt-5 flex items-center justify-center gap-2 !text-xs !font-semibold !text-[#111111]"
          onClick={() => navigate({ to: '/login' })}
        >
          <ArrowLeftOutlined className="text-[11px]" />
          Back to login
        </Typography.Link>

        <div className="mt-6 flex min-h-[42px] items-center justify-center rounded-lg bg-[#f3fbf7] px-3 text-center font-serif text-xs font-medium leading-snug text-[#145c3d] shadow-[0_6px_18px_rgba(20,92,61,0.06)]">
          <SafetyCertificateOutlined className="mr-2 shrink-0 text-base !text-[#18a058]" />
          <span>Protected by Secure Sign-in</span>
        </div>
      </Form>
    </AuthPanel>
  )
}

export default ForgotPassword
