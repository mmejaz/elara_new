import { Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Skeleton, Switch } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, type ReactNode } from 'react'
import { useCreateRecord, useUpdateRecord } from '../queries'
import type { GlobalSettingField, GlobalSettingRecord } from '../types'
import { serverMessage } from '../../../utils/formErrors'
import { notify, toast } from '../../../utils/toast'
import type { ApiError } from '../../../types/api'

interface RecordDrawerProps {
  appId: number
  fields: GlobalSettingField[]
  open: boolean
  record: GlobalSettingRecord | null
  onClose: () => void
  /** The app's fields are still loading (fetched when the drawer opens). */
  loading?: boolean
}

function fieldInput(field: GlobalSettingField): ReactNode {
  switch (field.type) {
    case 'number':
      return <InputNumber className="!w-full" placeholder={field.label} />
    case 'password':
      return <Input.Password placeholder={field.label} autoComplete="new-password" />
    case 'textarea':
      return <Input.TextArea rows={2} placeholder={field.label} />
    case 'dropdown':
      return (
        <Select
          allowClear
          placeholder={`Select ${field.label}`}
          options={field.options.map((o) => ({ value: o, label: o }))}
        />
      )
    case 'boolean':
      return <Switch />
    case 'date':
      return <DatePicker className="!w-full" />
    default:
      return <Input placeholder={field.label} />
  }
}

function RecordDrawer({ appId, fields, open, record, onClose, loading }: RecordDrawerProps) {
  const [form] = Form.useForm()
  const create = useCreateRecord(appId)
  const update = useUpdateRecord(appId)
  const mutation = record ? update : create

  useEffect(() => {
    if (!open) return
    const data = record?.data ?? {}
    const values: Record<string, unknown> = {}
    fields.forEach((f) => {
      const v = data[f.key]
      values[f.key] = f.type === 'date' && v ? dayjs(v as string) : (v ?? undefined)
    })
    form.setFieldsValue(values)
  }, [open, record, fields, form])

  const handleFinish = (values: Record<string, unknown>) => {
    const data: Record<string, unknown> = {}
    fields.forEach((f) => {
      let v = values[f.key]
      if (f.type === 'date' && v) v = (v as Dayjs).format('YYYY-MM-DD')
      data[f.key] = v ?? null
    })

    mutation.mutate((record ? { id: record.id, data } : { data }) as never, {
      onSuccess: () => {
        notify.success(record ? 'Record updated' : 'Record added', 'Saved successfully.')
        form.resetFields()
        onClose()
      },
      onError: (error) => {
        // Server errors come back keyed as "data.{key}" — map them onto the fields.
        const errs = (error as ApiError)?.response?.data?.errors
        if (errs && typeof errs === 'object') {
          form.setFields(
            Object.entries(errs).map(([name, messages]) => ({
              name: name.replace(/^data\./, ''),
              errors: Array.isArray(messages) ? messages : [messages],
            })),
          )
        } else {
          toast.error(serverMessage(error, 'Unable to save record'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title={record ? 'Edit Record' : 'Add Record'}
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {record ? 'Save' : 'Add'}
          </Button>
        </div>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : fields.length === 0 ? (
        <p className="text-sm text-gray-500">This application has no fields yet. Edit the application to add fields first.</p>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {fields.map((f) => (
            <Form.Item
              key={f.key}
              name={f.key}
              label={f.label}
              valuePropName={f.type === 'boolean' ? 'checked' : 'value'}
              rules={f.is_required ? [{ required: true, message: `${f.label} is required` }] : []}
            >
              {fieldInput(f)}
            </Form.Item>
          ))}
        </Form>
      )}
    </Drawer>
  )
}

export default RecordDrawer
