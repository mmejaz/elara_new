import { Button, Drawer, Form, Input, Select } from 'antd'
import { useEffect, useMemo } from 'react'
import { useUrlDrawer } from '../../../components/DataTable'
import { useDepartmentOptions, useUpdateDepartment } from '../queries'
import { useOrganizationOptions } from '../../organizations/queries'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

function EditDepartmentDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.departments.editDrawerOpen)
  const editing = useAppSelector((state) => state.departments.editing)
  const mode = useAppSelector((state) => state.auth.departmentMode)
  const [form] = Form.useForm()
  const mutation = useUpdateDepartment()
  const { data: departments = [], isLoading: optionsLoading } = useDepartmentOptions()
  const { data: organizations = [], isLoading: orgLoading } = useOrganizationOptions()

  useEffect(() => {
    if (editing) form.setFieldsValue({
      name: editing.name,
      parent_id: editing.parent_id ?? undefined,
      organization_id: editing.organization_id ?? undefined,
    })
  }, [editing, form])

  // A department may not be parented to itself or to any of its own descendants
  // (that would create a cycle). Exclude the whole subtree from the picker.
  const parentOptions = useMemo(() => {
    if (!editing) return departments.map((d) => ({ value: d.id, label: d.name }))

    const excluded = new Set<number>([editing.id])
    let grew = true
    while (grew) {
      grew = false
      for (const d of departments) {
        if (d.parent_id != null && excluded.has(d.parent_id) && !excluded.has(d.id)) {
          excluded.add(d.id)
          grew = true
        }
      }
    }

    return departments.filter((d) => !excluded.has(d.id)).map((d) => ({ value: d.id, label: d.name }))
  }, [editing, departments])

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
      title={t('pages.departments.edit')}
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
            options={parentOptions}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditDepartmentDrawer
