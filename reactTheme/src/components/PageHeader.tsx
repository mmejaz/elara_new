import { Card, Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useAppSelector } from '../store/hooks'

const { Text, Title } = Typography

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  extra?: ReactNode
}

/**
 * Reusable gradient page-header card. Renders a title + subtitle with an accent
 * bar, and an optional `extra` slot on the right for actions/filters.
 */
function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const borderRadius = useAppSelector((state) => state.ui.borderRadius)
  const isDark = themeMode === 'dark'

  return (
    <Card
      className="w-full"
      styles={{ body: { padding: '20px 24px' } }}
      style={{
        borderRadius,
        border: isDark ? '1px solid #303030' : '1px solid #e8ecf2',
        background: isDark
          ? 'linear-gradient(120deg, #1c1c1c 0%, #141414 55%, #121212 100%)'
          : 'linear-gradient(120deg, #fbfcff 0%, #ffffff 55%, #f8fafc 100%)',
        boxShadow: isDark ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Flex align="center" gap={16} justify="space-between" wrap>
        <Flex align="flex-start" className="min-w-0 flex-1" gap={14}>
          <span
            aria-hidden
            className="mt-1 hidden h-10 w-1 shrink-0 rounded-full sm:block"
            style={{ background: primaryColor }}
          />
          <div className="min-w-0">
            <Title className="!m-0 !text-[22px] !font-semibold !leading-tight !tracking-tight md:!text-2xl">
              {title}
            </Title>
            {subtitle && (
              <Text className="!mt-1.5 !block !text-[13px] !leading-relaxed !text-[#64748b] dark:!text-[#94a3b8]">
                {subtitle}
              </Text>
            )}
          </div>
        </Flex>

        {extra}
      </Flex>
    </Card>
  )
}

export default PageHeader
