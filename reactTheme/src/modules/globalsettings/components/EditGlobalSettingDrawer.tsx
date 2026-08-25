import { Button, Divider, Drawer, Form, Input, Skeleton, Typography } from 'antd'
import { useEffect } from 'react'
import { useUrlDrawer } from '../../../components/DataTable'
import { useGlobalSetting, useUpdateGlobalSetting } from '../queries'
import FieldsBuilder from './FieldsBuilder'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'

const { Text } = Typography

function EditGlobalSettingDrawer() {
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.globalSettings.editDrawerOpen)
  const editing = useAppSelector((state) => state.globalSettings.editing)
  const [form] = Form.useForm()
  const mutation = useUpdateGlobalSetting()

  // Load the full app (with its field definitions) when the drawer opens.
  const { data: app, isLoading } = useGlobalSetting(open && editing ? editing.id : null)

  useEffect(() => {
    if (app) form.setFieldsValue({ name: app.name, fields: app.fields ?? [] })
  }, [app, form])

  const handleFinish = (values: Record<string, unknown>) => {
    if (!editing) return
    mutation.mutate({ id: editing.id, ...values }, {
      onSuccess: () => {
        toast.success('Application updated')
        drawer.close()
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to update'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    drawer.close()
  }

  return (
    <Drawer
      title="Edit Application"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>Save</Button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Application Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
            <Input placeholder="e.g. SMTP" size="large" autoFocus />
          </Form.Item>

          <Divider className="!my-3" />
          <Text strong className="!mb-2 !block">
            Fields
            <span className="ml-1 text-xs font-normal text-gray-400">— the inputs this app captures</span>
          </Text>
          <FieldsBuilder />
        </Form>
      )}
    </Drawer>
  )
}

export default EditGlobalSettingDrawer
