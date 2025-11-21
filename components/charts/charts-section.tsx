'use client'

import { useState } from 'react'
import { BotInteraction } from '@/lib/types'
import TrendChart from './trend-chart'
import ActivityDistribution from './activity-distribution'
import ScatterChartComp from './scatter-chart'
import CategoryStatsChart from './category-stats-chart'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ChartsSectionProps {
  data: BotInteraction[]
  onCategoryClick?: (category: string) => void
}

/**
 * 图表区域容器组件
 * 包含所有数据可视化图表,支持折叠/展开
 */
export default function ChartsSection({ data, onCategoryClick }: ChartsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📊 数据可视化</h3>
          <p className="text-sm text-gray-500 mt-1">
            图表展示 Bot 交互数据的多维度分析
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1"
        >
          <span>{isExpanded ? '收起' : '展开'}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* 图表网格 - 响应式布局 (2x2) */}
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 趋势图 */}
          <div>
            <TrendChart data={data} />
          </div>
          {/* 活跃度分布饼图 */}
          <div>
            <ActivityDistribution data={data} />
          </div>
          {/* 散点图 */}
          <div>
            <ScatterChartComp data={data} />
          </div>
          {/* 分类统计图 */}
          <div>
            <CategoryStatsChart
              data={data}
              onCategoryClick={onCategoryClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}
