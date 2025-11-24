'use client'

import { useMemo } from 'react'
import { BotInteraction } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDataRanges } from '@/lib/filter-utils'

interface CategoryStatsChartProps {
  data: BotInteraction[]
  onCategoryClick?: (category: string) => void
}

export default function CategoryStatsChart({
  data,
  onCategoryClick
}: CategoryStatsChartProps) {
  // 计算各分类的 Bot 数量
  const categoryStats = useMemo(() => {
    const dataRanges = getDataRanges(data)
    const maxEvents = dataRanges.eventCount[1]

    return [
      {
        category: '热门',
        count: data.filter(bot => bot.eventCount >= maxEvents * 0.7).length,
        color: '#ef4444',  // 红色
        key: 'hot'
      },
      {
        category: '高活跃',
        count: data.filter(bot => (bot.avgActivity ?? 0) >= 8).length,
        color: '#f59e0b',  // 橙色
        key: 'high-activity'
      },
      {
        category: '新兴潜力',
        count: data.filter(bot =>
          (bot.uniqueUsers ?? 0) < 50 && (bot.avgActivity ?? 0) >= 6
        ).length,
        color: '#10b981',  // 绿色
        key: 'emerging'
      },
      {
        category: '受欢迎',
        count: data.filter(bot => (bot.uniqueUsers ?? 0) >= 100).length,
        color: '#3b82f6',  // 蓝色
        key: 'popular'
      }
    ]
  }, [data])

  // 处理条形点击事件
  const handleBarClick = (data: any) => {
    if (onCategoryClick && data && data.key) {
      onCategoryClick(data.key)
    }
  }

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded shadow-lg border">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm">Bot 数量: {data.count}</p>
          <p className="text-xs text-gray-500 mt-1">点击可筛选</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          <span>Bot 分类统计</span>
        </CardTitle>
        <p className="text-sm text-gray-500">
          点击条形可快速切换到对应筛选
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              cursor="pointer"
              onClick={handleBarClick}
            >
              {categoryStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
