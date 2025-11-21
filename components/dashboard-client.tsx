'use client'

import { useState } from 'react'
import { BotInteraction } from '@/lib/types'
import BotTable from './bot-table'
import DataActions from './data-actions'
import { PresetFilter } from '@/lib/filter-utils'

interface DashboardClientProps {
  initialBots: BotInteraction[]
  lastUpdate: string
  externalFilterTrigger?: PresetFilter | null  // 外部触发的筛选器
  onFilterApplied?: () => void                   // 筛选应用后的回调
}

/**
 * 仪表盘客户端组件
 * 管理筛选后的数据状态,在 BotTable 和 DataActions 之间共享
 */
export default function DashboardClient({
  initialBots,
  lastUpdate,
  externalFilterTrigger,
  onFilterApplied
}: DashboardClientProps) {
  const [filteredData, setFilteredData] = useState<BotInteraction[]>(initialBots)

  return (
    <>
      {/* 顶部操作区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">数据概览</h2>
          <p className="text-sm text-gray-500">
            最后更新: {lastUpdate ? new Date(lastUpdate).toLocaleString('zh-CN') : '未知'}
          </p>
        </div>
        <DataActions
          allData={initialBots}
          filteredData={filteredData}
        />
      </div>

      {/* 数据表格区域 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Bot 交互详情</h3>
          <p className="text-sm text-gray-500 mt-1">
            显示所有 Bot 的交互数据，支持排序、搜索和筛选
          </p>
        </div>
        <BotTable
          data={initialBots}
          onFilteredDataChange={setFilteredData}
          externalFilterTrigger={externalFilterTrigger}
          onFilterApplied={onFilterApplied}
        />
      </div>
    </>
  )
}
