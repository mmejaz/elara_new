import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, DatePicker, Drawer, Form, Input, Select, Skeleton } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo } from 'react'
import { toast } from '../../../utils/toast'
import { useCreateUser, usePermissions, useRolesDetailed } from '../queries'
import { useOrganizationOptions } from '../../organizations/queries'
import { useDepartmentOptions } from '../../departments/queries'
import { useUrlDrawer } from '../../../components/DataTable'
import PermissionPicker from '../../roles/components/PermissionPicker'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppSelector } from '../../../store/hooks'

function AddUserDrawer() {
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.users.addDrawerOpen)
  const [form] = Form.useForm()

  // Only fetch the drawer's reference data once it's actually open.
  const { data: roles = [], isLoading: rolesLoading } = useRolesDetailed(open)
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizationOptions(open)
  const { data: departments = [], isLoading: deptsLoading } = useDepartmentOptions(open)
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions(open)
  const roleOptions = roles.map((role) => ({ value: role.name, label: role.name }))
  const mutation = useCreateUser()

  // When a role is picked, preview the permissions it grants (read-only).
  const selectedRoleName = Form.useWatch('role', form)
  const selectedRole = roles.find((role) => role.name === selectedRoleName)
  const rolePermissions = selectedRole?.permissions ?? []

  // Department depends on the chosen organization(s): offer shared departments
  // (org_id null) plus any owned by a selected org. The field stays disabled
  // until an organization is picked, and a stale selection is cleared when the
  // organizations change.
  const selectedOrgIds = (Form.useWatch('organization_ids', form) as number[] | undefined) ?? []
  const orgKey = selectedOrgIds.join(',')
  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.organization_id == null || selectedOrgIds.includes(d.organization_id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departments, orgKey],
  )
  useEffect(() => {
    const current = form.getFieldValue('department_id')
    if (current != null && !filteredDepartments.some((d) => d.id === current)) {
      form.setFieldValue('department_id', undefined)
    }
  }, [filteredDepartments, form])

  const handleFinish = (values) => {
    // The DatePicker yields a Dayjs; the API wants an ISO date string.
    const payload = {
      ...values,
      joining_date: (values.joining_date as Dayjs | undefined)?.format('YYYY-MM-DD') ?? null,
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('User created successfully')
        form.resetFields()
        drawer.close()
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create user'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    drawer.close()
  }

  return (
    <Drawer
      title="Add New User"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={mutation.isPending}
            onClick={() => form.submit()}
          >
            Create User
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Enter the user's name" }]}
        >
          <Input
            autoComplete="off"
            placeholder="Jane Doe"
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
        >
          <Input
            autoComplete="off"
            placeholder="jane@example.com"
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Enter a password' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Select a role' }]}
        >
          <Select
            loading={rolesLoading}
            options={roleOptions}
            placeholder="Select a role"
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Organizations"
          name="organization_ids"
          rules={[{ required: true, message: 'Assign at least one organization' }]}
          tooltip="Every user must belong to at least one organization. A Super Admin still sees all organizations regardless of assignment."
        >
          <Select
            mode="multiple"
            loading={orgsLoading}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            placeholder="Assign at least one organization"
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Department"
          name="department_id"
          rules={[{ required: true, message: 'Select a department' }]}
          tooltip="Select an organization first — the list shows that organization's departments plus shared ones."
        >
          <Select
            loading={deptsLoading}
            disabled={selectedOrgIds.length === 0}
            options={filteredDepartments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder={selectedOrgIds.length === 0 ? 'Select an organization first' : 'Select a department'}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item label="Joining Date" name="joining_date">
          <DatePicker
            className="!w-full"
            size="large"
            format="YYYY-MM-DD"
            placeholder="Select joining date"
          />
        </Form.Item>

        {selectedRoleName && (
          <Form.Item
            label={
              <span className="font-medium">
                Access from this role
                <span className="ml-1 text-xs font-normal text-gray-400">
                  — permissions granted, by module
                </span>
              </span>
            }
          >
            {permissionsLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <PermissionPicker permissions={permissions} value={rolePermissions} disabled />
            )}
          </Form.Item>
        )}
      </Form>
    </Drawer>
  )
}

export default AddUserDrawer
