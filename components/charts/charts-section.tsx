'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BotInteraction } from '@/lib/types'
import TrendChart from './trend-chart'
import ActivityDistribution from './activity-distribution'
import ScatterChartComp from './scatter-chart'
import CategoryStatsChart from './category-stats-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ChartsSectionProps {
  data: BotInteraction[]
}

/**
 * 图表区域容器组件
 * 包含所有数据可视化图表,支持折叠/展开
 * 点击分类图表可跳转到 Bot 页面并应用筛选
 */
export default function ChartsSection({ data }: ChartsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const router = useRouter()

  // 处理分类点击，跳转到 Bot 页面
  const handleCategoryClick = (categoryKey: string) => {
    router.push(`/bots?filter=${categoryKey}`)
  }

  return (
    <Card className="dark:bg-card dark:border-border">
      {/* 标题栏 */}
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>📊 数据可视化</CardTitle>
            <CardDescription className="mt-1.5">
              图表展示 Bot 交互数据的多维度分析
            </CardDescription>
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
      </CardHeader>

      {/* 图表网格 - 响应式布局 (2x2) */}
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
