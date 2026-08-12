import { Alert, Button, Col, Drawer, Form, Input, Row, Select } from 'antd'
import { useCreateTenant } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { notify, toast } from '../../../utils/toast'

interface Props {
  open: boolean
  onClose: () => void
}

const TIMEZONES = ['UTC', 'Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York']
const CURRENCIES = ['USD', 'PKR', 'AED', 'GBP', 'EUR']
const LANGUAGES = ['en', 'ur', 'ar']

function CreateTenantDrawer({ open, onClose }: Props) {
  const [form] = Form.useForm()
  const mutation = useCreateTenant()

  const handleFinish = (values: Record<string, unknown>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        notify.success('Tenant created', 'The tenant database is being provisioned.')
        form.resetFields()
        onClose()
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create tenant'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title="Create Tenant"
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            Create tenant
          </Button>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        className="!mb-4"
        title="What happens on create"
        description={
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>A dedicated database is created, migrated and seeded.</li>
            <li>The first admin below is created inside that tenant.</li>
            <li>The tenant is reached at its domain (needs DNS/host setup).</li>
          </ul>
        }
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ timezone: 'UTC', currency: 'USD', language: 'en', status: 'active' }}
      >
        <Form.Item label="Organization name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
          <Input placeholder="e.g. School One" size="large" autoFocus />
        </Form.Item>

        <Form.Item
          label="Domain"
          name="domain"
          rules={[
            { required: true, message: 'Enter a domain' },
            { pattern: /^[a-z0-9.-]+$/, message: 'Letters, numbers, dots and hyphens only' },
          ]}
          extra="Full host the tenant is reached at, e.g. school1.elara.test"
        >
          <Input placeholder="school1.elara.test" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="First admin email"
              name="admin_email"
              rules={[
                { required: true, message: 'Enter an email' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input placeholder="admin@school1.test" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="First admin password"
              name="admin_password"
              rules={[
                { required: true, message: 'Enter a password' },
                { min: 8, message: 'At least 8 characters' },
              ]}
            >
              <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Timezone" name="timezone">
              <Select options={TIMEZONES.map((t) => ({ value: t, label: t }))} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Currency" name="currency">
              <Select options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Language" name="language">
              <Select options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Contact email" name="email" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="Optional" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Optional" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  )
}

export default CreateTenantDrawer
