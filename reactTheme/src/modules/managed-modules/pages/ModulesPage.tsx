import { AppstoreOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Space, Spin, Switch, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import { ICONS } from '../../../config/iconRegistry'
import { useModules, useSetModuleVisibility } from '../../../hooks/useModules'
import { toast } from '../../../utils/toast'
import { hexToRgba } from '../../../utils/color'
import { useAppSelector } from '../../../store/hooks'

const { Text } = Typography

function ModulesPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { data: all = [], isLoading } = useModules()
  const setVisibility = useSetModuleVisibility()

  // Show actual modules (menu items), not section headers.
  const modules = useMemo(() => all.filter((m) => m.type === 'item'), [all])

  const toggle = (module, checked) => {
    setVisibility.mutate(
      { id: module.id, is_visible: checked },
      {
        onSuccess: () =>
          toast.success(`${module.name} ${checked ? 'activated' : 'deactivated'}`),
        onError: () => toast.error('Unable to update module'),
      },
    )
  }

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Managed Modules"
        subtitle="Activate or deactivate modules. Inactive modules are hidden from the sidebar."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : modules.length === 0 ? (
        <Empty description="No modules found." />
      ) : (
        <Row gutter={[12, 12]}>
          {modules.map((module) => {
            const Icon = (module.icon ? ICONS[module.icon] : undefined) ?? AppstoreOutlined
            return (
              <Col key={module.id} xs={24} sm={12} lg={8}>
                <Card styles={{ body: { padding: 18 } }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
                        style={{
                          background: hexToRgba(primaryColor, 0.12),
                          color: primaryColor,
                        }}
                      >
                        <Icon />
                      </div>
                      <div>
                        <Text strong className="!block">
                          {module.name}
                        </Text>
                        <div className="flex items-center gap-2">
                          <Tag color={module.is_resourceful ? 'green' : 'gold'} className="!text-xs">
                            {module.is_resourceful ? 'CRUD' : 'Menu'}
                          </Tag>
                          <Tag color={module.is_visible ? 'success' : 'default'} className="!text-xs">
                            {module.is_visible ? 'Active' : 'Inactive'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={module.is_visible}
                      loading={setVisibility.isPending}
                      onChange={(checked) => toggle(module, checked)}
                    />
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </Space>
  )
}

export default ModulesPage
