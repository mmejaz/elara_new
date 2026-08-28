import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { useUrlDrawer } from '../../../components/DataTable'
import { useUpdateCountry } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function EditCountryDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
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
        toast.success(t('common.updateSuccess'))
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
      title={t('pages.countries.edit')}
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>{t('common.save')}</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item label={t('common.name')} name="name" rules={[{ required: true, message: t('common.enterName') }]}>
          <Input placeholder={t('common.namePlaceholder')} size="large" autoFocus />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditCountryDrawer
