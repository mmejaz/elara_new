import { Button, Checkbox, Drawer, Form, Input, Radio, Select, Tag, TreeSelect, Typography } from 'antd'
import { notify, toast } from '../../../utils/toast'
import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useMemo } from 'react'
import { closeAddDrawer } from '../moduleBuilderSlice'
import { useCreateModule } from '../../../hooks/useModules'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import { useModuleTree } from '../../../hooks/useModuleTree'
import { buildParentOptions } from '../navTree'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

const { Text } = Typography

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'export']

const ICON_OPTIONS = [
  { value: 'AppstoreOutlined', label: 'Appstore', icon: <AppstoreOutlined /> },
  { value: 'TeamOutlined', label: 'Team', icon: <TeamOutlined /> },
  { value: 'BookOutlined', label: 'Book', icon: <BookOutlined /> },
  { value: 'BankOutlined', label: 'Bank', icon: <BankOutlined /> },
  { value: 'CalendarOutlined', label: 'Calendar', icon: <CalendarOutlined /> },
  { value: 'FileTextOutlined', label: 'File', icon: <FileTextOutlined /> },
]

// group = a section header in the sidebar (e.g. "Management")
// item  = a menu entry. Either a Parent Menu (container that holds children)
//         or Resourceful (a CRUD leaf). Controlled by the `resourceful` flag.
const MODULE_TYPES = [
  { value: 'item', label: 'Menu Item' },
  { value: 'group', label: 'Group / Section' },
]

function AddModuleDrawer() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.moduleBuilder.addDrawerOpen)
  const [form] = Form.useForm()
  const mutation = useCreateModule()

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
        notify.success('Module created', 'The module was created successfully.')
        form.resetFields()
        dispatch(closeAddDrawer())
      },
      onError: (error) => {
        if (!applyServerErrors(error, form)) {
          toast.error(serverMessage(error, 'Unable to create module'))
        }
      },
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    form.resetFields()
    dispatch(closeAddDrawer())
  }

  return (
    <Drawer
      title="Create New Module"
      placement="right"
      size={480}
      open={open}
      onClose={handleClose}
      maskClosable={!mutation.isPending}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            Generate Module
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
        initialValues={{ type: 'item', resourceful: true, permissions: PERMISSION_ACTIONS }}
      >
        <Form.Item
          label="Module Name"
          name="name"
          rules={[
            { required: true, message: 'Enter the module name' },
            { pattern: /^[A-Za-z ]+$/, message: 'Only letters and spaces are allowed' },
          ]}
          extra="e.g. Students, Courses, Invoices"
        >
          <Input placeholder="e.g. Students" size="large" autoFocus />
        </Form.Item>

        <Form.Item
          label="Type"
          name="type"
          rules={[{ required: true, message: 'Select a type' }]}
          extra="How this entry appears in the sidebar."
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
                label="Parent / Section"
                name="parent"
                rules={[{ required: true, message: 'Choose where this module lives' }]}
                extra="Pick a section to place it under, or a menu item to nest it inside."
              >
                <TreeSelect
                  size="large"
                  placeholder="Select section or parent module"
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
                label="Menu Item Type"
                name="resourceful"
                extra="Resourceful generates full CRUD files (list, drawers, service, controller). Parent Menu is a container — nest resourceful items under it."
              >
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value={true}>Resourceful (CRUD)</Radio.Button>
                  <Radio.Button value={false}>Parent Menu</Radio.Button>
                </Radio.Group>
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item label="Icon" name="icon">
          <Select
            placeholder="Select an icon"
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

        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Short description of what this module manages" rows={2} />
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
                label="Permissions to Generate"
                name="permissions"
                rules={[{ required: true, message: 'Select at least one permission' }]}
              >
                <Checkbox.Group
                  options={PERMISSION_ACTIONS.map((a) => ({
                    value: a,
                    label: a.charAt(0).toUpperCase() + a.slice(1),
                  }))}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item label="Preview" shouldUpdate>
          {({ getFieldValue }) => {
            const name = getFieldValue('name')?.trim()
            const type = getFieldValue('type')
            const parent = getFieldValue('parent')
            const resourceful = type === 'item' && getFieldValue('resourceful')
            const perms = getFieldValue('permissions') ?? []
            if (!name) return <Text type="secondary">Fill the form to see a preview.</Text>

            const typeLabel = MODULE_TYPES.find((t) => t.value === type)?.label
            const placement =
              type === 'group'
                ? 'New top-level section'
                : parent
                  ? `Under: ${parent.startsWith('group:') ? parent.slice(6) : parent}`
                  : 'No parent selected'

            return (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Tag color="geekblue">{typeLabel}</Tag>
                  {type === 'item' && (
                    <Tag color={resourceful ? 'green' : 'gold'}>
                      {resourceful ? 'Resourceful · CRUD' : 'Parent Menu'}
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
