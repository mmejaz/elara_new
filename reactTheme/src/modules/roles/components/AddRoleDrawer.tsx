import { Button, Drawer, Form, Input, Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'
import { toast } from '../../../utils/toast'
import { useCreateRole, usePermissions } from '../queries'
import { useUrlDrawer } from '../../../components/DataTable'
import PermissionPicker from './PermissionPicker'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useAppSelector } from '../../../store/hooks'

function AddRoleDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.roles.addDrawerOpen)
  const [form] = Form.useForm()

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const mutation = useCreateRole()

  const handleFinish = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Role created successfully')
        form.resetFields()
        drawer.close()
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create role'))
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
      title="Add New Role"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            loading={mutation.isPending}
            onClick={() => form.submit()}
          >
            {t('common.create')}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
        initialValues={{ permissions: [] }}
      >
        <Form.Item
          label="Role Name"
          name="name"
          rules={[{ required: true, message: 'Enter a role name' }]}
        >
          <Input placeholder="e.g. Accountant" size="large" />
        </Form.Item>

        <Form.Item name="permissions">
          {permissionsLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <PermissionPicker
              permissions={permissions}
              title={
                <span className="font-medium">
                  Permissions
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    — expand a module to select
                  </span>
                </span>
              }
            />
          )}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddRoleDrawer
