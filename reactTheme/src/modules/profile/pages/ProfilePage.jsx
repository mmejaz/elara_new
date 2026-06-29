import { MailOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Col, Divider, Row, Space, Tag, Typography } from 'antd'
import { useSelector } from 'react-redux'
import PageHeader from '../../../components/PageHeader'

const { Text } = Typography

function ProfilePage() {
  const user = useSelector((state) => state.auth.user)
  const roles = useSelector((state) => state.auth.roles)
  const primaryColor = useSelector((state) => state.ui.primaryColor)
  const isDark = useSelector((state) => state.ui.themeMode === 'dark')

  const rowStyle = {
    background: isDark ? '#1f1f1f' : '#f9fafb',
    border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Profile"
        subtitle="Your account information."
      />

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={8}>
          <Card className="h-full">
            <div className="flex flex-col items-center text-center">
              <Avatar
                size={88}
                style={{ backgroundColor: primaryColor, color: '#fff' }}
                icon={!user?.name ? <UserOutlined /> : undefined}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : null}
              </Avatar>

              <Text strong className="!mt-4 !text-lg">
                {user?.name || 'User'}
              </Text>
              <Text type="secondary">{user?.email}</Text>

              <Divider />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <Text type="secondary">Status</Text>
                  <Tag color="success">Active</Tag>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Text type="secondary">Roles</Text>
                  <div className="flex flex-wrap justify-end gap-1">
                    {roles?.length ? (
                      roles.map((role) => (
                        <Tag key={role} color="processing" icon={<SafetyCertificateOutlined />}>
                          {role}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">None</Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Account Information" className="h-full">
            <div className="space-y-4">
              <div style={rowStyle}>
                <UserOutlined className="text-gray-400" />
                <div>
                  <Text type="secondary" className="!block !text-xs">Full Name</Text>
                  <Text strong>{user?.name || '—'}</Text>
                </div>
              </div>

              <div style={rowStyle}>
                <MailOutlined className="text-gray-400" />
                <div>
                  <Text type="secondary" className="!block !text-xs">Email Address</Text>
                  <Text strong>{user?.email || '—'}</Text>
                </div>
              </div>

              <div style={rowStyle}>
                <SafetyCertificateOutlined className="text-gray-400" />
                <div>
                  <Text type="secondary" className="!block !text-xs">Assigned Roles</Text>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {roles?.length ? (
                      roles.map((role) => (
                        <Tag key={role} color="processing">{role}</Tag>
                      ))
                    ) : (
                      <Text type="secondary">No roles assigned</Text>
                    )}
                  </div>
                </div>
              </div>

              <div style={rowStyle}>
                <UserOutlined className="text-gray-400" />
                <div>
                  <Text type="secondary" className="!block !text-xs">Member Since</Text>
                  <Text strong>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default ProfilePage
