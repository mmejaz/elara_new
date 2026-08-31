import { Alert, Button, Checkbox, Drawer, Form, Input, Radio, Select, Tag, TreeSelect, Typography } from 'antd'
import { toast } from '../../../utils/toast'
import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useMemo } from 'react'
import { useCreateModule } from '../../../hooks/useModules'
import { useUrlDrawer } from '../../../components/DataTable'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useModuleTree } from '../../../hooks/useModuleTree'
import { buildParentOptions } from '../navTree'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'export']

// group = a section header in the sidebar (e.g. "Management")
// item  = a menu entry. Either a Parent Menu (container that holds children)
//         or Resourceful (a CRUD leaf). Controlled by the `resourceful` flag.

function AddModuleDrawer() {
  const { t } = useTranslation()
  const drawer = useUrlDrawer()
  const open = useAppSelector((state) => state.moduleBuilder.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateModule()

  // Option lists drive logic by their stable `value`; only the label is translated.
  const ICON_OPTIONS = useMemo(
    () => [
      { value: 'AppstoreOutlined', label: t('moduleBuilder.drawer.icon.appstore'), icon: <AppstoreOutlined /> },
      { value: 'TeamOutlined', label: t('moduleBuilder.drawer.icon.team'), icon: <TeamOutlined /> },
      { value: 'BookOutlined', label: t('moduleBuilder.drawer.icon.book'), icon: <BookOutlined /> },
      { value: 'BankOutlined', label: t('moduleBuilder.drawer.icon.bank'), icon: <BankOutlined /> },
      { value: 'CalendarOutlined', label: t('moduleBuilder.drawer.icon.calendar'), icon: <CalendarOutlined /> },
      { value: 'FileTextOutlined', label: t('moduleBuilder.drawer.icon.file'), icon: <FileTextOutlined /> },
    ],
    [t],
  )

  const MODULE_TYPES = useMemo(
    () => [
      { value: 'item', label: t('moduleBuilder.drawer.typeMenuItem') },
      { value: 'group', label: t('moduleBuilder.drawer.typeGroupSection') },
    ],
    [t],
  )

  const { data: tree } = useModuleTree()
  const parentOptions = useMemo(() => buildParentOptions(tree ?? []), [tree])

  const handleFinish = (values) => {
    const isGroup = values.type === 'group'
    // Resourceful only applies to a Menu Item; it drives CRUD file generation.
    const resourceful = values.type === 'item' ? !!values.resourceful : false
    const payload = {
      name: values.name.trim(),
      type: values.type,
      resourceful,
      parent: isGroup ? null : (values.parent ?? null),
      icon: values.icon ?? null,
      description: values.description?.trim() ?? null,
      permissions: resourceful ? (values.permissions ?? []) : [],
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t('moduleBuilder.drawer.createdSuccess'))
        form.resetFields()
        drawer.close()
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, t('moduleBuilder.drawer.createError')))
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
      title={t('moduleBuilder.drawer.title')}
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {t('moduleBuilder.drawer.generate')}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: 'item', resourceful: true, permissions: PERMISSION_ACTIONS }}
      >
        <Alert
          type="info"
          showIcon
          className="!mb-4"
          title={t('moduleBuilder.drawer.alertTitle')}
          description={
            <ul className="mt-1 list-disc pl-4 text-xs">
              <li>
                {t('moduleBuilder.drawer.alertRequiredBefore')}{' '}
                <span className="text-red-500">*</span>{' '}
                {t('moduleBuilder.drawer.alertRequiredAfter')}
              </li>
              <li>{t('moduleBuilder.drawer.alertLetters')}</li>
              <li>{t('moduleBuilder.drawer.alertResourceful')}</li>
            </ul>
          }
        />
        <Form.Item
          label={t('moduleBuilder.drawer.nameLabel')}
          name="name"
          rules={[
            { required: true, message: t('moduleBuilder.drawer.nameRequired') },
            { pattern: /^[A-Za-z ]+$/, message: t('moduleBuilder.drawer.namePattern') },
          ]}
          extra={t('moduleBuilder.drawer.nameExtra')}
        >
          <Input placeholder={t('moduleBuilder.drawer.namePlaceholder')} size="large" autoFocus />
        </Form.Item>

        <Form.Item
          label={t('moduleBuilder.drawer.typeLabel')}
          name="type"
          rules={[{ required: true, message: t('moduleBuilder.drawer.typeRequired') }]}
          extra={t('moduleBuilder.drawer.typeExtra')}
        >
          <Radio.Group
            options={MODULE_TYPES}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>

        {/* Placement: parent/section. Hidden for top-level groups.
            Position (Order) is managed later from the table. */}
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
          {({ getFieldValue }) =>
            getFieldValue('type') === 'group' ? null : (
              <Form.Item
                label={t('moduleBuilder.drawer.parentLabel')}
                name="parent"
                rules={[{ required: true, message: t('moduleBuilder.drawer.parentRequired') }]}
                extra={t('moduleBuilder.drawer.parentExtra')}
              >
                <TreeSelect
                  size="large"
                  placeholder={t('moduleBuilder.drawer.parentPlaceholder')}
                  treeData={parentOptions}
                  treeDefaultExpandAll
                  showSearch
                  treeNodeFilterProp="title"
                  allowClear
                />
              </Form.Item>
            )
          }
        </Form.Item>

        {/* Resourceful: only a Menu Item can be a full CRUD resource. */}
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
          {({ getFieldValue }) =>
            getFieldValue('type') === 'item' ? (
              <Form.Item
                label={t('moduleBuilder.drawer.menuItemTypeLabel')}
                name="resourceful"
                extra={t('moduleBuilder.drawer.menuItemTypeExtra')}
              >
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value={true}>{t('moduleBuilder.drawer.resourcefulCrud')}</Radio.Button>
                  <Radio.Button value={false}>{t('moduleBuilder.drawer.parentMenu')}</Radio.Button>
                </Radio.Group>
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item label={t('moduleBuilder.drawer.iconLabel')} name="icon">
          <Select
            placeholder={t('moduleBuilder.drawer.iconPlaceholder')}
            size="large"
            allowClear
            options={ICON_OPTIONS.map((o) => ({
              value: o.value,
              label: (
                <span className="inline-flex items-center gap-2">
                  {o.icon} {o.label}
                </span>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item label={t('moduleBuilder.drawer.descriptionLabel')} name="description">
          <Input.TextArea placeholder={t('moduleBuilder.drawer.descriptionPlaceholder')} rows={2} />
        </Form.Item>

        {/* Permissions only apply to a resourceful Menu Item (has CRUD). */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) =>
            prev.type !== cur.type || prev.resourceful !== cur.resourceful
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('type') === 'item' && getFieldValue('resourceful') ? (
              <Form.Item
                label={t('moduleBuilder.drawer.permissionsLabel')}
                name="permissions"
                rules={[{ required: true, message: t('moduleBuilder.drawer.permissionsRequired') }]}
              >
                <Checkbox.Group
                  options={PERMISSION_ACTIONS.map((a) => ({
                    value: a,
                    label: t(`moduleBuilder.drawer.perm.${a}`),
                  }))}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item label={t('moduleBuilder.drawer.previewLabel')} shouldUpdate>
          {({ getFieldValue }) => {
            const name = getFieldValue('name')?.trim()
            const type = getFieldValue('type')
            const parent = getFieldValue('parent')
            const resourceful = type === 'item' && getFieldValue('resourceful')
            const perms = getFieldValue('permissions') ?? []
            if (!name) return <Text type="secondary">{t('moduleBuilder.drawer.previewEmpty')}</Text>

            const typeLabel = MODULE_TYPES.find((opt) => opt.value === type)?.label
            const placement =
              type === 'group'
                ? t('moduleBuilder.drawer.previewNewSection')
                : parent
                  ? t('moduleBuilder.drawer.previewUnder', {
                      parent: parent.startsWith('group:') ? parent.slice(6) : parent,
                    })
                  : t('moduleBuilder.drawer.previewNoParent')

            return (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Tag color="geekblue">{typeLabel}</Tag>
                  {type === 'item' && (
                    <Tag color={resourceful ? 'green' : 'gold'}>
                      {resourceful ? t('moduleBuilder.resourcefulCrud') : t('moduleBuilder.drawer.parentMenu')}
                    </Tag>
                  )}
                  <Text type="secondary">{placement}</Text>
                </div>
                {resourceful && perms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {perms.map((action) => (
                      <Tag key={action} color="blue">
                        {action} {name.toLowerCase()}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            )
          }}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default AddModuleDrawer
