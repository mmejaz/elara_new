import {
  CalendarOutlined,
  CameraOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  MinusCircleOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import apiClient from '../../../services/apiClient'
import { setUser } from '../../../store/authSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import type { ApiError } from '../../../types/api'
import type { UserSettings } from '../../../types/models'
import { applyServerErrors } from '../../../utils/formErrors'
import { notify, toast } from '../../../utils/toast'

const { Text } = Typography

const MAX_AVATAR_MB = 2
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  product_updates: false,
  profile_public: false,
}

// New-password requirements, kept in sync with the backend rule
// (Password::min(8)->mixedCase()->numbers()->symbols()).
const PASSWORD_RULES: { labelKey: string; test: (v: string) => boolean }[] = [
  { labelKey: 'profile.security.rules.minLength', test: (v) => v.length >= 8 },
  { labelKey: 'profile.security.rules.lowercase', test: (v) => /[a-z]/.test(v) },
  { labelKey: 'profile.security.rules.uppercase', test: (v) => /[A-Z]/.test(v) },
  { labelKey: 'profile.security.rules.number', test: (v) => /[0-9]/.test(v) },
  { labelKey: 'profile.security.rules.special', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

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

interface RoleAccess {
  name: string
  permissions: string[]
}

interface AccessData {
  roles: RoleAccess[]
  direct_permissions: string[]
}

function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const roles = useAppSelector((state) => state.auth.roles)
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const isDark = useAppSelector((state) => state.ui.themeMode === 'dark')

  const [uploading, setUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [settingsForm] = Form.useForm()

  // Live value of the new-password field, for the requirements checklist.
  const newPassword = Form.useWatch('password', passwordForm) ?? ''

  // Roles + permissions breakdown for the Access tab (lazy-loaded).
  const [access, setAccess] = useState<AccessData | null>(null)
  const [accessLoading, setAccessLoading] = useState(true)

  useEffect(() => {
    let active = true
    apiClient
      .get('/profile/access')
      .then(({ data }) => {
        if (active) setAccess(data.data)
      })
      .catch(() => {
        if (active) setAccess({ roles: [], direct_permissions: [] })
      })
      .finally(() => {
        if (active) setAccessLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

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

  const savePersonal = async (values: Record<string, unknown>) => {
    setSavingProfile(true)
    try {
      const { data } = await apiClient.put('/profile', values)
      dispatch(setUser(data.data.user))
      toast.success('Profile updated')
    } catch (error) {
      if (!applyServerErrors(error, profileForm)) {
        const { title, description } = apiErrorNotice(error, 'Unable to update profile')
        notify.error(title, description, { placement: 'topRight' })
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (values: Record<string, unknown>) => {
    setSavingPassword(true)
    try {
      await apiClient.put('/profile/password', values)
      passwordForm.resetFields()
      toast.success('Password changed')
    } catch (error) {
      if (!applyServerErrors(error, passwordForm)) {
        const { title, description } = apiErrorNotice(error, 'Unable to change password')
        notify.error(title, description, { placement: 'topRight' })
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const saveSettings = async (values: Record<string, unknown>) => {
    setSavingSettings(true)
    try {
      const { data } = await apiClient.put('/profile/settings', values)
      dispatch(setUser(data.data.user))
      toast.success('Settings saved')
    } catch (error) {
      const { title, description } = apiErrorNotice(error, 'Unable to save settings')
      notify.error(title, description, { placement: 'topRight' })
    } finally {
      setSavingSettings(false)
    }
  }

  const location = [user?.city, user?.country].filter(Boolean).join(', ') || '—'

  const tabItems = [
    {
      key: 'personal',
      label: (
        <span>
          <UserOutlined /> {t('profile.tabs.personal')}
        </span>
      ),
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          requiredMark={false}
          onFinish={savePersonal}
          initialValues={{
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            designation: user?.designation,
            country: user?.country,
            city: user?.city,
            bio: user?.bio,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={t('profile.personal.fullName')} name="name" rules={[{ required: true, message: t('profile.personal.nameRequired') }]}>
                <Input prefix={<UserOutlined />} placeholder={t('profile.personal.namePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('profile.personal.email')}
                name="email"
                rules={[
                  { required: true, message: t('profile.personal.emailRequired') },
                  { type: 'email', message: t('profile.personal.emailInvalid') },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder={t('profile.personal.emailPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('profile.personal.phone')} name="phone">
                <Input prefix={<PhoneOutlined />} placeholder={t('profile.personal.phonePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('profile.personal.designation')} name="designation">
                <Input prefix={<IdcardOutlined />} placeholder={t('profile.personal.designationPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('profile.personal.country')} name="country">
                <Input prefix={<EnvironmentOutlined />} placeholder={t('profile.personal.countryPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('profile.personal.city')} name="city">
                <Input prefix={<EnvironmentOutlined />} placeholder={t('profile.personal.cityPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label={t('profile.personal.bio')} name="bio">
                <Input.TextArea rows={3} maxLength={2000} showCount placeholder={t('profile.personal.bioPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={savingProfile}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: 'access',
      label: (
        <span>
          <SafetyCertificateOutlined /> {t('profile.tabs.access')}
        </span>
      ),
      children: accessLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TeamOutlined style={{ color: primaryColor }} />
            <Text strong>{t('profile.access.rolesHeading')}</Text>
          </div>
          {access?.roles.length ? (
            <Collapse
              defaultActiveKey={access.roles.map((r) => r.name)}
              items={access.roles.map((role) => ({
                key: role.name,
                label: (
                  <span className="flex items-center gap-2">
                    <SafetyCertificateOutlined style={{ color: primaryColor }} />
                    <span className="font-medium">{role.name}</span>
                    <Tag>
                      {t('profile.access.permissionCount', { count: role.permissions.length })}
                    </Tag>
                  </span>
                ),
                children: role.permissions.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p) => (
                      <Tag key={p} color="processing" icon={<KeyOutlined />}>
                        {p}
                      </Tag>
                    ))}
                  </div>
                ) : role.name === 'Super Admin' ? (
                  <Text type="secondary">{t('profile.access.superAdminAccess')}</Text>
                ) : (
                  <Text type="secondary">{t('profile.access.noRolePermissions')}</Text>
                ),
              }))}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('profile.access.noRolesAssigned')} />
          )}

          <Divider />

          <div className="mb-1 flex items-center gap-2">
            <KeyOutlined style={{ color: primaryColor }} />
            <Text strong>{t('profile.access.directHeading')}</Text>
            {access?.direct_permissions.length ? <Tag>{access.direct_permissions.length}</Tag> : null}
          </div>
          <Text type="secondary" className="!mb-3 !block !text-xs">
            {t('profile.access.directDescription')}
          </Text>
          {access?.direct_permissions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {access.direct_permissions.map((p) => (
                <Tag key={p} color="success" icon={<KeyOutlined />}>
                  {p}
                </Tag>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('profile.access.noDirectPermissions')} />
          )}
        </div>
      ),
    },
    {
      key: 'security',
      forceRender: true,
      label: (
        <span>
          <LockOutlined /> {t('profile.tabs.security')}
        </span>
      ),
      children: (
        <Form form={passwordForm} layout="vertical" requiredMark={false} onFinish={savePassword}>
          <Row gutter={[24, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('profile.security.oldPassword')}
                name="current_password"
                rules={[{ required: true, message: t('profile.security.oldPasswordRequired') }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('profile.security.oldPasswordPlaceholder')} autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                label={t('profile.security.newPassword')}
                name="password"
                rules={[
                  { required: true, message: t('profile.security.newPasswordRequired') },
                  {
                    validator: (_, value) =>
                      !value || PASSWORD_RULES.every((r) => r.test(value))
                        ? Promise.resolve()
                        : Promise.reject(new Error(t('profile.security.requirementsError'))),
                  },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('profile.security.newPasswordPlaceholder')} autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label={t('profile.security.confirmPassword')}
                name="password_confirmation"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('profile.security.confirmPasswordRequired') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve()
                      return Promise.reject(new Error(t('profile.security.passwordsMismatch')))
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('profile.security.confirmPasswordPlaceholder')} autoComplete="new-password" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Text strong className="!block !mb-3">
                {t('profile.security.requirementsTitle')}
              </Text>
              <ul className="m-0 list-none space-y-2.5 p-0">
                {PASSWORD_RULES.map((rule) => {
                  const met = newPassword ? rule.test(newPassword) : false
                  return (
                    <li key={rule.labelKey} className="flex items-center gap-2.5">
                      {met ? (
                        <CheckCircleFilled style={{ color: '#52c41a' }} />
                      ) : (
                        <MinusCircleOutlined style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }} />
                      )}
                      <Text type={met ? undefined : 'secondary'}>{t(rule.labelKey)}</Text>
                    </li>
                  )
                })}
              </ul>
            </Col>
          </Row>

          <div className="mt-2 flex justify-end gap-2">
            <Button onClick={() => passwordForm.resetFields()} disabled={savingPassword}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={savingPassword}>
              {t('common.save')}
            </Button>
          </div>
        </Form>
      ),
    },
    {
      key: 'settings',
      forceRender: true,
      label: (
        <span>
          <SettingOutlined /> {t('profile.tabs.settings')}
        </span>
      ),
      children: (
        <Form
          form={settingsForm}
          layout="horizontal"
          onFinish={saveSettings}
          initialValues={{ ...DEFAULT_SETTINGS, ...(user?.settings ?? {}) }}
        >
          <div className="max-w-lg space-y-2">
            <div style={rowStyle} className="!justify-between">
              <div>
                <Text strong className="!block">{t('profile.settings.emailNotifications')}</Text>
                <Text type="secondary" className="!text-xs">{t('profile.settings.emailNotificationsDesc')}</Text>
              </div>
              <Form.Item name="email_notifications" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div style={rowStyle} className="!justify-between">
              <div>
                <Text strong className="!block">{t('profile.settings.productUpdates')}</Text>
                <Text type="secondary" className="!text-xs">{t('profile.settings.productUpdatesDesc')}</Text>
              </div>
              <Form.Item name="product_updates" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div style={rowStyle} className="!justify-between">
              <div>
                <Text strong className="!block">{t('profile.settings.publicProfile')}</Text>
                <Text type="secondary" className="!text-xs">{t('profile.settings.publicProfileDesc')}</Text>
              </div>
              <Form.Item name="profile_public" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="primary" htmlType="submit" loading={savingSettings}>
              {t('profile.settings.save')}
            </Button>
          </div>
        </Form>
      ),
    },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={8}>
          <Card className="h-full">
            <div className="flex flex-col items-center text-center">
              <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload} disabled={uploading}>
                <div className="group relative cursor-pointer" style={{ width: 96, height: 96 }} title={t('profile.changePhoto')}>
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

                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <CameraOutlined style={{ fontSize: 22 }} />
                  </div>

                  <span
                    className="absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: primaryColor, boxShadow: `0 0 0 3px ${cardBg}` }}
                  >
                    <CameraOutlined style={{ fontSize: 13 }} />
                  </span>
                </div>
              </Upload>

              <Text strong className="!mt-4 !text-lg">
                {user?.name || t('profile.defaultName')}
              </Text>
              {user?.designation && <Text type="secondary">{user.designation}</Text>}

              {user?.avatar && (
                <Popconfirm title={t('profile.removePhotoConfirm')} onConfirm={removeAvatar} okText={t('profile.remove')}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={uploading} className="!mt-2">
                    {t('profile.removePhoto')}
                  </Button>
                </Popconfirm>
              )}

              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {roles?.length ? (
                  roles.map((role) => (
                    <Tag key={role} color="processing" icon={<SafetyCertificateOutlined />}>
                      {role}
                    </Tag>
                  ))
                ) : (
                  <Tag>{t('profile.noRoles')}</Tag>
                )}
              </div>

              <Divider />

              <div className="w-full space-y-3 text-left">
                <div style={rowStyle}>
                  <MailOutlined style={{ color: primaryColor }} />
                  <div className="min-w-0">
                    <Text type="secondary" className="!block !text-xs">{t('profile.email')}</Text>
                    <Text strong className="!block truncate">{user?.email || '—'}</Text>
                  </div>
                </div>
                <div style={rowStyle}>
                  <PhoneOutlined style={{ color: primaryColor }} />
                  <div className="min-w-0">
                    <Text type="secondary" className="!block !text-xs">{t('profile.phone')}</Text>
                    <Text strong className="!block">{user?.phone || '—'}</Text>
                  </div>
                </div>
                <div style={rowStyle}>
                  <EnvironmentOutlined style={{ color: primaryColor }} />
                  <div className="min-w-0">
                    <Text type="secondary" className="!block !text-xs">{t('profile.location')}</Text>
                    <Text strong className="!block">{location}</Text>
                  </div>
                </div>
                <div style={rowStyle}>
                  <CalendarOutlined style={{ color: primaryColor }} />
                  <div className="min-w-0">
                    <Text type="secondary" className="!block !text-xs">{t('profile.joined')}</Text>
                    <Text strong className="!block">{formatDate(user?.created_at)}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="h-full">
            <Tabs items={tabItems} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default ProfilePage
