'use client'

import { useState, useRef } from 'react'
import { BotInteraction } from '@/lib/types'
import ChartsSection from './charts/charts-section'
import DashboardClient from './dashboard-client'
import { PresetFilter } from '@/lib/filter-utils'

interface DashboardWrapperProps {
  bots: BotInteraction[]
  lastUpdate: string
  totalEvents: number    // 所有 Bot 的总事件数
  totalUsers: number     // 所有 Bot 的总用户数
}

/**
 * 仪表盘包装组件
 * 管理图表和表格之间的交互,将分类点击事件连接到筛选器
 */
export default function DashboardWrapper({ bots, lastUpdate, totalEvents, totalUsers }: DashboardWrapperProps) {
  // 用于触发 BotTable 筛选器的状态
  const [triggerFilter, setTriggerFilter] = useState<PresetFilter | null>(null)

  /**
   * 处理分类图表点击事件
   * 映射分类 key 到预设筛选器
   */
  const handleCategoryClick = (categoryKey: string) => {
    const filterMap: Record<string, PresetFilter> = {
      'hot': 'hot',
      'high-activity': 'high-activity',
      'emerging': 'emerging',
      'popular': 'popular'
    }

    const filter = filterMap[categoryKey]
    if (filter) {
      setTriggerFilter(filter)
      // 滚动到表格区域
      setTimeout(() => {
        const tableSection = document.getElementById('bot-table-section')
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  return (
    <>
      {/* 数据可视化图表 */}
      <ChartsSection
        data={bots}
      />

      {/* 表格区域 */}
      <div id="bot-table-section">
        <DashboardClient
          initialBots={bots}
          lastUpdate={lastUpdate}
          totalEvents={totalEvents}
          totalUsers={totalUsers}
          externalFilterTrigger={triggerFilter}
          onFilterApplied={() => setTriggerFilter(null)}
        />
      </div>
    </>
  )
}
