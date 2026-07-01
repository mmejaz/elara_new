import { Button, Result } from 'antd'
import { useNavigate } from '@tanstack/react-router'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" onClick={() => navigate({ to: '/dashboard' })}>
          Back to Dashboard
        </Button>
      }
    />
  )
}

export default NotFoundPage
