import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { closeEditDrawer } from '../documentTypesSlice'
import { useUpdateDocumentType } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

function EditDocumentTypeDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.documentTypes.editDrawerOpen)
  const editing = useAppSelector((state) => state.documentTypes.editing)
  const [form] = Form.useForm()
  const mutation = useUpdateDocumentType()

  useEffect(() => {
    if (editing) form.setFieldsValue({ name: editing.name })
  }, [editing, form])

  const handleFinish = (values: Record<string, unknown>) => {
    if (!editing) return
    mutation.mutate({ id: editing.id, ...values }, {
      onSuccess: () => {
        toast.success('Document Type updated')
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
      title="Edit Document Type"
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

export default EditDocumentTypeDrawer
