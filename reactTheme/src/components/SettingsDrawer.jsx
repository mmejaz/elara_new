import {
  BgColorsOutlined,
  BorderOutlined,
  BulbFilled,
  BulbOutlined,
  FontSizeOutlined,
  LayoutOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  ColorPicker,
  Divider,
  Drawer,
  Grid,
  Radio,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Typography,
} from 'antd'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  DEFAULT_SETTINGS,
  PRIMARY_PRESETS,
  closeSettingsDrawer,
  pickThemeSettings,
  resetThemeSettings,
  updateThemeSettings,
} from '../store/uiSlice'

const { Text, Title } = Typography

const fontFamilyOptions = [
  {
    label: 'Inter / System',
    value:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  { label: 'Aptos', value: 'Aptos, Calibri, "Segoe UI", sans-serif' },
  {
    label: 'IBM Plex Sans',
    value: '"IBM Plex Sans", Inter, system-ui, sans-serif',
  },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  {
    label: 'JetBrains Mono',
    value: '"JetBrains Mono", "Courier New", monospace',
  },
]

function SectionHeader({ color, description, icon, title }) {
  return (
    <div className="mb-4">
      <Title
        level={5}
        className="!mb-0 flex items-center gap-2 !text-[15px] !font-semibold !leading-tight"
      >
        <span className="text-base" style={{ color }}>
          {icon}
        </span>
        <span>{title}</span>
      </Title>
      <Text type="secondary" className="!mt-1.5 block !text-[12px] !leading-snug">
        {description}
      </Text>
    </div>
  )
}

function ToggleRow({ checked, description, onChange, title }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Text strong className="!text-[13px]">
          {title}
        </Text>
        <Text type="secondary" className="!mt-0.5 block !text-[12px] !leading-snug">
          {description}
        </Text>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

function SettingsDrawer() {
  const dispatch = useDispatch()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const open = useSelector((state) => state.ui.settingsDrawerOpen)
  const settings = useSelector((state) => state.ui)
  const [draftSettings, setDraftSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  // Resync the draft from the live store on the closed -> open transition, so it
  // never shows stale values. (Render-phase reset pattern — avoids an effect.)
  if (open !== wasOpen) {
    setWasOpen(open)

    if (open) {
      setDraftSettings(settings)
      setHasChanges(false)
    }
  }

  const updateDraft = (updates) => {
    setDraftSettings((current) => ({ ...current, ...updates }))
    setHasChanges(true)
  }

  const handleCancel = () => {
    setDraftSettings(settings)
    setHasChanges(false)
    dispatch(closeSettingsDrawer())
  }

  const handleSave = () => {
    dispatch(updateThemeSettings(pickThemeSettings(draftSettings)))
    message.success('Theme settings saved')
    setHasChanges(false)
    dispatch(closeSettingsDrawer())
  }

  const handleReset = () => {
    dispatch(resetThemeSettings())
    setDraftSettings(DEFAULT_SETTINGS)
    setHasChanges(false)
    message.success('Theme settings reset')
  }

  return (
    <Drawer
      title={
        <Space>
          <BgColorsOutlined />
          <span>Theme Settings</span>
        </Space>
      }
      placement="right"
      size={screens.md ? 420 : '100%'}
      open={open}
      onClose={handleCancel}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Reset
          </Button>
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSave} disabled={!hasChanges}>
              Save changes
            </Button>
          </Space>
        </div>
      }
    >
      <div className="space-y-7">
        <section>
          <SectionHeader
            icon={
              draftSettings.themeMode === 'dark' ? <BulbFilled /> : <BulbOutlined />
            }
            title="Appearance"
            description="Switch the whole admin panel between light and dark mode."
            color={draftSettings.primaryColor}
          />
          <Segmented
            block
            value={draftSettings.themeMode}
            onChange={(value) => updateDraft({ themeMode: value })}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
          />
        </section>

        <Divider className="!my-0" />

        <section>
          <SectionHeader
            icon={<BgColorsOutlined />}
            title="Brand Color"
            description="Pick the primary color for buttons, active menu items, and highlights."
            color={draftSettings.primaryColor}
          />
          <ColorPicker
            className="w-full"
            value={draftSettings.primaryColor}
            onChange={(color) =>
              updateDraft({
                primaryPreset: 'custom',
                primaryColor: color.toHexString(),
              })
            }
            showText
            size="large"
          />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Object.entries(PRIMARY_PRESETS).map(([key, color]) => (
              <button
                key={key}
                type="button"
                className="h-[34px] cursor-pointer rounded-lg border-[3px] border-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
                style={{
                  background: color,
                  outline:
                    draftSettings.primaryColor.toLowerCase() ===
                    color.toLowerCase()
                      ? `2px solid ${color}`
                      : 'none',
                }}
                onClick={() =>
                  updateDraft({ primaryPreset: key, primaryColor: color })
                }
                aria-label={`${key} theme`}
              />
            ))}
          </div>
        </section>

        <Divider className="!my-0" />

        <section>
          <SectionHeader
            icon={<FontSizeOutlined />}
            title="Typography"
            description="Tune font family and density for a clearer admin reading experience."
            color={draftSettings.primaryColor}
          />
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Text strong className="!text-[13px]">
                Font family
              </Text>
              <Select
                className="mt-2 w-full"
                value={draftSettings.fontFamily}
                onChange={(value) => updateDraft({ fontFamily: value })}
                options={fontFamilyOptions}
              />
            </div>
            <div>
              <Text strong className="!text-[13px]">
                Interface scale
              </Text>
              <Segmented
                block
                className="mt-2"
                value={draftSettings.fontScale}
                onChange={(value) => updateDraft({ fontScale: value })}
                options={[
                  { label: 'Compact', value: 'compact' },
                  { label: 'Comfort', value: 'comfortable' },
                  { label: 'Large', value: 'large' },
                ]}
              />
            </div>
          </Space>
        </section>

        <Divider className="!my-0" />

        <section>
          <SectionHeader
            icon={<LayoutOutlined />}
            title="Layout"
            description="Adjust header behavior, content framing, and control density."
            color={draftSettings.primaryColor}
          />
          <Space direction="vertical" size="large" className="w-full">
            <ToggleRow
              title="Sticky header"
              description="Keep the top bar visible while scrolling."
              checked={draftSettings.stickyHeader}
              onChange={(checked) => updateDraft({ stickyHeader: checked })}
            />
            <ToggleRow
              title="Compact controls"
              description="Reduce Ant Design component spacing."
              checked={draftSettings.compactMode}
              onChange={(checked) => updateDraft({ compactMode: checked })}
            />
            <ToggleRow
              title="Animations"
              description="Use soft transitions across layout changes."
              checked={draftSettings.showAnimations}
              onChange={(checked) => updateDraft({ showAnimations: checked })}
            />
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <Text strong className="!text-[13px]">
                  Header height
                </Text>
                <Text type="secondary" className="!text-xs">
                  {draftSettings.headerHeight}px
                </Text>
              </div>
              <Slider
                min={54}
                max={78}
                step={2}
                value={draftSettings.headerHeight}
                onChange={(value) => updateDraft({ headerHeight: value })}
              />
            </div>
            <div>
              <Text strong className="!text-[13px]">
                Content layout
              </Text>
              <Radio.Group
                className="mt-2 grid w-full grid-cols-2"
                value={draftSettings.contentLayout}
                onChange={(event) =>
                  updateDraft({ contentLayout: event.target.value })
                }
              >
                <Radio.Button value="fullscreen" className="text-center">
                  Full
                </Radio.Button>
                <Radio.Button value="framed" className="text-center">
                  Framed
                </Radio.Button>
              </Radio.Group>
            </div>
          </Space>
        </section>

        <Divider className="!my-0" />

        <section>
          <SectionHeader
            icon={<BorderOutlined />}
            title="Shape"
            description="Round or sharpen cards, buttons, inputs, and menus."
            color={draftSettings.primaryColor}
          />
          <div className="mb-1 flex items-center justify-between gap-3">
            <Text strong className="!text-[13px]">
              Border radius
            </Text>
            <Text type="secondary" className="!text-xs">
              {draftSettings.borderRadius}px
            </Text>
          </div>
          <Slider
            min={0}
            max={20}
            value={draftSettings.borderRadius}
            onChange={(value) => updateDraft({ borderRadius: value })}
          />
        </section>

        <section>
          <div
            className="grid gap-1 bg-slate-100 p-4 dark:bg-white/10"
            style={{
              borderRadius: draftSettings.borderRadius,
              fontFamily: draftSettings.fontFamily,
              fontSize:
                draftSettings.fontScale === 'compact'
                  ? 13
                  : draftSettings.fontScale === 'large'
                    ? 16
                    : 14,
            }}
          >
            <Text strong style={{ color: draftSettings.primaryColor }}>
              Preview
            </Text>
            <Text type="secondary" className="block">
              Dashboard cards, forms, and menus will follow this style.
            </Text>
            <Button type="primary" size="small" className="mt-3">
              Primary action
            </Button>
          </div>
        </section>
      </div>
    </Drawer>
  )
}

export default SettingsDrawer
