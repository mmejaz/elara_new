import { Alert, Button, Drawer, Form, Input } from 'antd'
import { useUrlDrawer } from '../../../components/DataTable'
import { useCreateGender } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'

function AddGenderDrawer() {
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.genders.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateGender()

  const handleFinish = (values: Record<string, unknown>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Gender created successfully')
        form.resetFields()
        drawer.close()
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
    drawer.close()
  }

  return (
    <Drawer
      title="Add Gender"
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
        title="Before you start"
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
      </Form>
    </Drawer>
  )
}

export default AddGenderDrawer
