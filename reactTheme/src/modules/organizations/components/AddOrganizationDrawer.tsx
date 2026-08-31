import { Alert, Button, Drawer, Form, Input, Select } from 'antd'
import { useUrlDrawer } from '../../../components/DataTable'
import { useCreateOrganization, useOrganizationOptions } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function AddOrganizationDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.organizations.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateOrganization()
  const { data: organizations = [], isLoading: optionsLoading } = useOrganizationOptions()

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
      title={t('pages.organizations.add')}
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
        message={t('common.beforeYouStart')}
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
        <Form.Item label={t('pages.organizations.fields.parent')} name="parent_id">
          <Select
            allowClear
            showSearch
            size="large"
            loading={optionsLoading}
            placeholder={t('pages.organizations.fields.parentPlaceholder')}
            optionFilterProp="label"
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddOrganizationDrawer
