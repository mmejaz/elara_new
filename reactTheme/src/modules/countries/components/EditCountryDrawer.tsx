import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { closeEditDrawer } from '../countriesSlice'
import { useUpdateCountry } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function EditCountryDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.countries.editDrawerOpen)
  const editing = useAppSelector((state) => state.countries.editing)
  const [form] = Form.useForm()
  const mutation = useUpdateCountry()

  useEffect(() => {
    if (editing) form.setFieldsValue({ name: editing.name })
  }, [editing, form])

  const handleFinish = (values: Record<string, unknown>) => {
    if (!editing) return
    mutation.mutate({ id: editing.id, ...values }, {
      onSuccess: () => {
        toast.success('Country updated')
        dispatch(closeEditDrawer())
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
    dispatch(closeEditDrawer())
  }

  return (
    <Drawer
      title="Edit Country"
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

export default EditCountryDrawer
