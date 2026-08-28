import { AppstoreOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Space, Spin, Switch, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import { useUrlTable } from '../../../components/DataTable'
import { ICONS } from '../../../config/iconRegistry'
import { useModules, useSetModuleVisibility } from '../../../hooks/useModules'
import { toast } from '../../../utils/toast'
import { hexToRgba } from '../../../utils/color'
import { useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

function ModulesPage() {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { data: all = [], isLoading } = useModules()
  const setVisibility = useSetModuleVisibility()
  // Search lives in the URL (?q=…) so the view is shareable and survives reload.
  const table = useUrlTable(15, t('managedModules.search'))

  // Show actual modules (menu items), not section headers — filtered by the search box.
  const modules = useMemo(() => {
    const q = table.search.trim().toLowerCase()
    return all.filter(
      (m) => m.type === 'item' && (!q || m.name.toLowerCase().includes(q)),
    )
  }, [all, table.search])

  const toggle = (module, checked) => {
    setVisibility.mutate(
      { id: module.id, is_visible: checked },
      {
        onSuccess: () =>
          toast.success(
            checked
              ? t('managedModules.activated', { name: module.name })
              : t('managedModules.deactivated', { name: module.name }),
          ),
        onError: () => toast.error(t('managedModules.updateError')),
      },
    )
  }

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={t('managedModules.title')}
        subtitle={t('managedModules.subtitle')}
        extra={table.searchInput}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : modules.length === 0 ? (
        <Empty description={t('managedModules.empty')} />
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
                            {module.is_resourceful ? t('managedModules.crud') : t('managedModules.menu')}
                          </Tag>
                          <Tag color={module.is_visible ? 'success' : 'default'} className="!text-xs">
                            {module.is_visible ? t('managedModules.active') : t('managedModules.inactive')}
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
