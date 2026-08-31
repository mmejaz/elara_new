import { Alert, Button, Drawer, Form, Input } from 'antd'
import { useUrlDrawer } from '../../../components/DataTable'
import { useCreateCountry } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function AddCountryDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.countries.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateCountry()

  const handleFinish = (values: Record<string, unknown>) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(t('common.createSuccess'))
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
      title={t('pages.countries.add')}
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>{t('common.create')}</Button>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        className="!mb-4"
        title={t('common.beforeYouStart')}
        description={
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>{t('common.requiredFieldsNote')}</li>
            <li>{t('common.uniqueNameNote')}</li>
          </ul>
        }
      />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label={t('common.name')} name="name" rules={[{ required: true, message: t('common.enterName') }]}>
          <Input placeholder={t('common.namePlaceholder')} size="large" autoFocus />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddCountryDrawer
