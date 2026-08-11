import { Result, Button, Space } from 'antd'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export const TenantNotFoundPage = () => {
  const handleGoHome = () => {
    window.location.href = 'http://localhost:5173'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <Result
        status="404"
        title="Tenant Not Found"
        subTitle={`The subdomain "${window.location.hostname}" does not exist or has been removed.`}
        extra={
          <Space>
            <Button type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
              Go to Central
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              Go Back
            </Button>
          </Space>
        }
      />
    </div>
  )
}
