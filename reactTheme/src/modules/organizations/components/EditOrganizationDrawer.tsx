import { Button, Drawer, Form, Input, Select } from 'antd'
import { useEffect, useMemo } from 'react'
import { useUrlDrawer } from '../../../components/DataTable'
import { useOrganizationOptions, useUpdateOrganization } from '../queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function EditOrganizationDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.organizations.editDrawerOpen)
  const editing = useAppSelector((state) => state.organizations.editing)
  const [form] = Form.useForm()
  const mutation = useUpdateOrganization()
  const { data: organizations = [], isLoading: optionsLoading } = useOrganizationOptions()

  useEffect(() => {
    if (editing) form.setFieldsValue({ name: editing.name, parent_id: editing.parent_id ?? undefined })
  }, [editing, form])

  // An organization may not be parented to itself or to any of its own
  // descendants (that would create a cycle). Exclude the whole subtree.
  const parentOptions = useMemo(() => {
    if (!editing) return organizations.map((o) => ({ value: o.id, label: o.name }))

    const excluded = new Set<number>([editing.id])
    let grew = true
    while (grew) {
      grew = false
      for (const o of organizations) {
        if (o.parent_id != null && excluded.has(o.parent_id) && !excluded.has(o.id)) {
          excluded.add(o.id)
          grew = true
        }
      }
    }

    return organizations.filter((o) => !excluded.has(o.id)).map((o) => ({ value: o.id, label: o.name }))
  }, [editing, organizations])

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
      title={t('pages.organizations.edit')}
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
        <Form.Item label={t('pages.organizations.fields.parent')} name="parent_id">
          <Select
            allowClear
            showSearch
            size="large"
            loading={optionsLoading}
            placeholder={t('pages.organizations.fields.parentPlaceholder')}
            optionFilterProp="label"
            options={parentOptions}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditOrganizationDrawer
