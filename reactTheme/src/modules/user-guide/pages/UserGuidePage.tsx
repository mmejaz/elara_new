import { Card, Empty, Menu, Space } from 'antd'
import { useMemo, useRef, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import MarkdownView from '../components/MarkdownView'
import { defaultKey, docsByKey, menuItems } from '../docs'
import '../user-guide.css'

/** Submenu key (`group:<folder>`) that contains a given doc, so it auto-expands. */
function groupOf(docKey: string): string | null {
  const slash = docKey.indexOf('/')
  return slash === -1 ? null : `group:${docKey.slice(0, slash)}`
}

function UserGuidePage() {
  const [activeKey, setActiveKey] = useState(defaultKey)
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const g = groupOf(defaultKey)
    return g ? [g] : []
  })
  const contentRef = useRef<HTMLDivElement>(null)

  const doc = docsByKey[activeKey]
  const panelHeight = 'calc(100vh - 210px)'

  const go = (key: string) => {
    if (!docsByKey[key]) return // group headers / non-docs — ignore
    setActiveKey(key)
    const g = groupOf(key)
    if (g && !openKeys.includes(g)) setOpenKeys((k) => [...k, g])
    contentRef.current?.scrollTo({ top: 0 })
  }

  const items = useMemo(() => menuItems, [])

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader title="User Guide" subtitle="Complete project documentation — architecture, setup, API, modules and more." />

      <Card styles={{ body: { padding: 0 } }}>
        <div className="flex" style={{ minHeight: panelHeight }}>
          {/* Left: navigation menu / submenus */}
          <div
            className="w-72 shrink-0 overflow-y-auto"
            style={{ maxHeight: panelHeight, borderRight: '1px solid rgba(127,127,127,0.18)' }}
          >
            <Menu
              mode="inline"
              items={items}
              selectedKeys={[activeKey]}
              openKeys={openKeys}
              onOpenChange={setOpenKeys}
              onClick={({ key }) => go(key)}
              style={{ border: 'none' }}
            />
          </div>

          {/* Right: rendered document */}
          <div ref={contentRef} className="min-w-0 flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: panelHeight }}>
            {doc ? (
              <MarkdownView content={doc.content} docKey={doc.key} onNavigate={go} />
            ) : (
              <Empty description="Select a document from the menu" />
            )}
          </div>
        </div>
      </Card>
    </Space>
  )
}

export default UserGuidePage
