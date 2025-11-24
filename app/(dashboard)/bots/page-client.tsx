'use client'

import { useEffect, useState } from 'react'
import { BotInteraction } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import BotTable from '@/components/bot-table'
import { PresetFilter } from '@/lib/filter-utils'

interface BotsPageClientProps {
  bots: BotInteraction[]
  initialFilter?: string
}

/**
 * Bot 页面客户端组件
 * 处理从URL参数传入的筛选器
 */
export function BotsPageClient({ bots, initialFilter }: BotsPageClientProps) {
  const [externalFilter, setExternalFilter] = useState<PresetFilter | null>(null)

  useEffect(() => {
    // 将 URL 参数转换为筛选器
    if (initialFilter && ['hot', 'high-activity', 'emerging', 'popular'].includes(initialFilter)) {
      setExternalFilter(initialFilter as PresetFilter)
      // 滚动到表格位置
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }, [initialFilter])

  return (
    <Card>
      <CardContent className="p-0">
        <BotTable
          data={bots}
          onFilteredDataChange={() => {}}
          externalFilterTrigger={externalFilter}
          onFilterApplied={() => setExternalFilter(null)}
        />
      </CardContent>
    </Card>
  )
}
