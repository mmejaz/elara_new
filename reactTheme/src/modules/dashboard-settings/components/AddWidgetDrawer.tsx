import { Alert, Button, Drawer, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../../store/hooks'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { toast } from '../../../utils/toast'
import { ICON_CHOICES, WIDGET_ICONS } from '../icons'
import { useCreateWidget } from '../queries'

interface Props {
  open: boolean
  onClose: () => void
}

function AddWidgetDrawer({ open, onClose }: Props) {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const [form] = Form.useForm()
  const mutation = useCreateWidget()

  const handleFinish = (values: { label: string; icon?: string }) => {
    mutation.mutate(
      { label: values.label.trim(), icon: values.icon },
      {
        onSuccess: () => {
          toast.success(t('dashboardSettings.widgetadded', { defaultValue: 'Widget added.' }))
          form.resetFields()
          onClose()
        },
        onError: (error) => {
          if (!applyServerErrors(error, form)) {
            toast.error(serverMessage(error, t('common.somethingWentWrong', { defaultValue: 'Something went wrong.' })))
          }
        },
      },
    )
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title={t('dashboardSettings.addWidget', { defaultValue: 'Add widget' })}
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {t('common.create')}
          </Button>
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
            <li>{t('dashboardSettings.addWidgetNote1', { defaultValue: 'A new widget is available to assign per role right away.' })}</li>
            <li>{t('dashboardSettings.addWidgetNote2', { defaultValue: 'Custom widgets show as a placeholder card until a developer wires a component.' })}</li>
          </ul>
        }
      />

      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ icon: 'appstore' }}>
        <Form.Item
          label={t('dashboardSettings.widgetName', { defaultValue: 'Widget name' })}
          name="label"
          rules={[{ required: true, message: t('dashboardSettings.enterWidgetName', { defaultValue: 'Enter a widget name' }) }]}
        >
          <Input placeholder={t('dashboardSettings.widgetNamePlaceholder', { defaultValue: 'e.g. Top Products' })} size="large" autoFocus />
        </Form.Item>

        <Form.Item label={t('dashboardSettings.icon', { defaultValue: 'Icon' })} name="icon">
          <IconPicker color={primaryColor} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

/** Controlled grid of selectable icon tokens (works as a Form.Item child). */
function IconPicker({ value, onChange, color }: { value?: string; onChange?: (v: string) => void; color: string }) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {ICON_CHOICES.map((token) => {
        const active = value === token
        return (
          <button
            key={token}
            type="button"
            onClick={() => onChange?.(token)}
            className="flex h-9 w-full items-center justify-center rounded-lg text-[16px] transition-colors"
            style={{
              background: active ? color : 'rgba(148,163,184,0.12)',
              color: active ? '#fff' : 'inherit',
              boxShadow: active ? `0 0 0 2px ${color}55` : 'none',
            }}
          >
            {WIDGET_ICONS[token]}
          </button>
        )
      })}
    </div>
  )
}

export default AddWidgetDrawer
