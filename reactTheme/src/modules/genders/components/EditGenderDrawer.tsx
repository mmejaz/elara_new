import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { useUrlDrawer } from '../../../components/DataTable'
import { useUpdateGender } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'

function EditGenderDrawer() {
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.genders.editDrawerOpen)
  const editing = useAppSelector((state) => state.genders.editing)
  const [form] = Form.useForm()
  const mutation = useUpdateGender()

  useEffect(() => {
    if (editing) form.setFieldsValue({ name: editing.name })
  }, [editing, form])

  const handleFinish = (values: Record<string, unknown>) => {
    if (!editing) return
    mutation.mutate({ id: editing.id, ...values }, {
      onSuccess: () => {
        toast.success('Gender updated')
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
      title="Edit Gender"
      placement="right"
      size={480}
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
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Enter a name' }]}>
          <Input placeholder="Enter name" size="large" autoFocus />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditGenderDrawer
