import {
  CalendarOutlined,
  CameraOutlined,
  DeleteOutlined,
  IdcardOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Divider, Popconfirm, Row, Space, Spin, Tag, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import apiClient from '../../../services/apiClient'
import { setUser } from '../../../store/authSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import type { ApiError } from '../../../types/api'
import { notify, toast } from '../../../utils/toast'

const { Text } = Typography

const MAX_AVATAR_MB = 2
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Turn an axios/Laravel error into a title + (validation) description for a corner notification. */
function apiErrorNotice(error: unknown, fallback: string) {
  const data = (error as ApiError)?.response?.data
  const messages = data?.errors ? Object.values(data.errors).flat() : []
  const description =
    messages.length > 1 ? (
      <>{messages.map((m, i) => <div key={i}>{m}</div>)}</>
    ) : (
      messages[0]
    )
  return { title: data?.message || fallback, description }
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const roles = useAppSelector((state) => state.auth.roles)
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const isDark = useAppSelector((state) => state.ui.themeMode === 'dark')

  const [uploading, setUploading] = useState(false)
  const cardBg = isDark ? '#141414' : '#ffffff'

  const rowStyle = {
    background: isDark ? '#1f1f1f' : '#f9fafb',
    border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const uploadAvatar = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('Invalid image', 'Please choose a JPG, PNG or WEBP image.', { placement: 'topRight' })
      return
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      notify.error('Image too large', `Image must be smaller than ${MAX_AVATAR_MB}MB.`, { placement: 'topRight' })
      return
    }

    const form = new FormData()
    form.append('avatar', file)

    setUploading(true)
    try {
      const { data } = await apiClient.post('/profile/avatar', form)
      dispatch(setUser(data.data.user))
      toast.success('Profile photo updated')
    } catch (error) {
      const { title, description } = apiErrorNotice(error, 'Unable to update photo')
      notify.error(title, description, { placement: 'topRight' })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    setUploading(true)
    try {
      const { data } = await apiClient.delete('/profile/avatar')
      dispatch(setUser(data.data.user))
      toast.success('Profile photo removed')
    } catch (error) {
      const { title, description } = apiErrorNotice(error, 'Unable to remove photo')
      notify.error(title, description, { placement: 'topRight' })
    } finally {
      setUploading(false)
    }
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    uploadAvatar(file as File)
    return false // handle the upload manually
  }

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader title="Profile" subtitle="Your account information." />

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={8}>
          <Card className="h-full">
            <div className="flex flex-col items-center text-center">
              <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload} disabled={uploading}>
                <div
                  className="group relative cursor-pointer"
                  style={{ width: 96, height: 96 }}
                  title="Change photo"
                >
                  <Spin spinning={uploading}>
                    <Avatar
                      size={96}
                      src={user?.avatar || undefined}
                      style={{ backgroundColor: primaryColor, color: '#fff' }}
                      icon={!user?.name ? <UserOutlined /> : undefined}
                    >
                      {user?.name && !user?.avatar ? user.name.charAt(0).toUpperCase() : null}
                    </Avatar>
                  </Spin>

                  {/* hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <CameraOutlined style={{ fontSize: 22 }} />
                  </div>

                  {/* camera badge seated on the avatar edge */}
                  <span
                    className="absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: primaryColor, boxShadow: `0 0 0 3px ${cardBg}` }}
                  >
                    <CameraOutlined style={{ fontSize: 13 }} />
                  </span>
                </div>
              </Upload>

              <Text strong className="!mt-4 !text-lg">
                {user?.name || 'User'}
              </Text>
              <Text type="secondary">{user?.email}</Text>

              {user?.avatar && (
                <Popconfirm title="Remove profile photo?" onConfirm={removeAvatar} okText="Remove">
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={uploading} className="!mt-2">
                    Remove photo
                  </Button>
                </Popconfirm>
              )}

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
                <UserOutlined style={{ color: primaryColor }} />
                <div>
                  <Text type="secondary" className="!block !text-xs">Full Name</Text>
                  <Text strong>{user?.name || '—'}</Text>
                </div>
              </div>

              <div style={rowStyle}>
                <MailOutlined style={{ color: primaryColor }} />
                <div>
                  <Text type="secondary" className="!block !text-xs">Email Address</Text>
                  <Text strong>{user?.email || '—'}</Text>
                </div>
              </div>

              <div style={rowStyle}>
                <IdcardOutlined style={{ color: primaryColor }} />
                <div>
                  <Text type="secondary" className="!block !text-xs">Assigned Roles</Text>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {roles?.length ? (
                      roles.map((role) => (
                        <Tag key={role} color="processing" icon={<SafetyCertificateOutlined />}>
                          {role}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">No roles assigned</Text>
                    )}
                  </div>
                </div>
              </div>

              <div style={rowStyle}>
                <CalendarOutlined style={{ color: primaryColor }} />
                <div>
                  <Text type="secondary" className="!block !text-xs">Portal Joining Date</Text>
                  <Text strong>{formatDate(user?.created_at)}</Text>
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
