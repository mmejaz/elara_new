import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select, Switch, Typography } from 'antd'

const { Text } = Typography

export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'password', label: 'Password' },
  { value: 'textarea', label: 'Text area' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'boolean', label: 'Toggle (Yes / No)' },
  { value: 'date', label: 'Date' },
  { value: 'image', label: 'Image' },
]

/**
 * Renders the "Fields" schema editor inside a Form (uses Form.List name="fields").
 * Each row is a field definition: label, type, dropdown options (runtime-added),
 * and a required toggle.
 */
function FieldsBuilder() {
  const form = Form.useFormInstance()

  return (
    <Form.List name="fields">
      {(items, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <Text type="secondary" className="!text-xs">
              No fields yet — add the inputs this app should capture (e.g. Host, Port, Encryption).
            </Text>
          )}

          {items.map(({ key, name }) => (
            <div key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Form.Item
                  name={[name, 'label']}
                  rules={[{ required: true, message: 'Label required' }]}
                  className="!mb-2 flex-1"
                >
                  <Input placeholder="Field label (e.g. Host)" />
                </Form.Item>
                <Form.Item name={[name, 'type']} className="!mb-2" style={{ minWidth: 160 }}>
                  <Select options={FIELD_TYPES} />
                </Form.Item>
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
              </div>

              {/* Dropdown values — only for the dropdown type. */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                  prev.fields?.[name]?.type !== cur.fields?.[name]?.type
                }
              >
                {() =>
                  form.getFieldValue(['fields', name, 'type']) === 'dropdown' ? (
                    <Form.Item
                      name={[name, 'options']}
                      className="!mb-2"
                      rules={[{ required: true, message: 'Add at least one value' }]}
                    >
                      <Select
                        mode="tags"
                        open={false}
                        suffixIcon={null}
                        placeholder="Type a value and press Enter"
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <div className="flex items-center gap-2">
                <Form.Item name={[name, 'is_required']} valuePropName="checked" className="!mb-0" initialValue={false}>
                  <Switch size="small" />
                </Form.Item>
                <Text className="!text-xs">Required</Text>
              </div>
            </div>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ type: 'text', is_required: false, options: [] })}
            block
          >
            Add Field
          </Button>
        </div>
      )}
    </Form.List>
  )
}

export default FieldsBuilder
