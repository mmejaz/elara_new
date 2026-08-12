import { Alert, Button, Drawer, Form, Input, Select } from 'antd'
import { closeAddDrawer } from '../departmentsSlice'
import { useCreateDepartment, useDepartmentOptions } from '../queries'
import { useOrganizationOptions } from '../../organizations/queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { notify, toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function AddDepartmentDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.departments.addDrawerOpen)
  const mode = useAppSelector((state) => state.auth.departmentMode)
  const [form] = Form.useForm()
  const mutation = useCreateDepartment()
  const { data: departments = [], isLoading: optionsLoading } = useDepartmentOptions()
  const { data: organizations = [], isLoading: orgLoading } = useOrganizationOptions()

  const handleFinish = (values: Record<string, unknown>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        notify.success('Department created', 'The record was created successfully.')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    dispatch(closeAddDrawer())
  }

  return (
    <Drawer
      title="Add Department"
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>Create</Button>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        className="!mb-4"
        message="Before you start"
        description={
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>Fields marked with <span className="text-red-500">*</span> are required.</li>
            <li>Enter a unique name — duplicate names aren't allowed.</li>
          </ul>
        }
      />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
          <Input placeholder="Enter name" size="large" autoFocus />
        </Form.Item>
        {mode !== 'shared' && (
          <Form.Item
            label="Organization"
            name="organization_id"
            rules={mode === 'scoped' ? [{ required: true, message: 'Select an organization' }] : []}
            extra={mode === 'flexible' ? 'Leave empty to share this department across all organizations.' : undefined}
          >
            <Select
              allowClear={mode === 'flexible'}
              showSearch
              size="large"
              loading={orgLoading}
              placeholder={mode === 'scoped' ? 'Select an organization' : 'None / Shared across all organizations'}
              optionFilterProp="label"
              options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            />
          </Form.Item>
        )}
        <Form.Item label="Parent Department" name="parent_id">
          <Select
            allowClear
            showSearch
            size="large"
            loading={optionsLoading}
            placeholder="None / Top Level Department"
            optionFilterProp="label"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddDepartmentDrawer
