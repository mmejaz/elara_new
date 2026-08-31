import { Alert, Button, Drawer, Form, Input, Select } from 'antd'
import { useUrlDrawer } from '../../../components/DataTable'
import { useCreateDepartment, useDepartmentOptions } from '../queries'
import { useOrganizationOptions } from '../../organizations/queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function AddDepartmentDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.departments.addDrawerOpen)
  const mode = useAppSelector((state) => state.auth.departmentMode)
  const [form] = Form.useForm()
  const mutation = useCreateDepartment()
  const { data: departments = [], isLoading: optionsLoading } = useDepartmentOptions()
  const { data: organizations = [], isLoading: orgLoading } = useOrganizationOptions()

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
      title={t('pages.departments.add')}
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
        {mode !== 'shared' && (
          <Form.Item
            label={t('pages.departments.fields.organization')}
            name="organization_id"
            rules={mode === 'scoped' ? [{ required: true, message: t('pages.departments.fields.organizationRequired') }] : []}
            extra={mode === 'flexible' ? t('pages.departments.fields.organizationShareHint') : undefined}
          >
            <Select
              allowClear={mode === 'flexible'}
              showSearch
              size="large"
              loading={orgLoading}
              placeholder={mode === 'scoped' ? t('pages.departments.fields.organizationPlaceholder') : t('pages.departments.fields.organizationSharedPlaceholder')}
              optionFilterProp="label"
              options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            />
          </Form.Item>
        )}
        <Form.Item label={t('pages.departments.fields.parent')} name="parent_id">
          <Select
            allowClear
            showSearch
            size="large"
            loading={optionsLoading}
            placeholder={t('pages.departments.fields.parentPlaceholder')}
            optionFilterProp="label"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddDepartmentDrawer
