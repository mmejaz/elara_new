import { Alert, Button, Divider, Drawer, Form, Input, Typography } from 'antd'
import { closeAddDrawer } from '../globalSettingsSlice'
import { useCreateGlobalSetting } from '../queries'
import FieldsBuilder from './FieldsBuilder'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { notify, toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

const { Text } = Typography

function AddGlobalSettingDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.globalSettings.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateGlobalSetting()

  const handleFinish = (values: Record<string, unknown>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        notify.success('Global Setting created', 'The record was created successfully.')
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
      title="Add Application"
      placement="right"
      size="large"
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
        title="Before you start"
        description={
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>Fields marked with <span className="text-red-500">*</span> are required.</li>
            <li>Name the application (e.g. SMTP) and define its input fields.</li>
            <li>You'll add the actual values later from the app's Configure screen.</li>
          </ul>
        }
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ fields: [] }}>
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
    </Drawer>
  )
}

export default AddGlobalSettingDrawer
