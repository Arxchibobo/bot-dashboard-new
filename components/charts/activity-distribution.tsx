'use client'

import { BotInteraction } from '@/lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivityDistributionProps {
  data: BotInteraction[]
}

/**
 * 活跃度分布饼图组件
 * 将 Bot 按活跃度分为三类: 高活跃、中活跃、低活跃
 */
export default function ActivityDistribution({ data }: ActivityDistributionProps) {
  // 1. 活跃度分类统计
  const categories = {
    high: data.filter(bot => (bot.avgActivity ?? 0) >= 8).length,
    medium: data.filter(bot => (bot.avgActivity ?? 0) >= 5 && (bot.avgActivity ?? 0) < 8).length,
    low: data.filter(bot => (bot.avgActivity ?? 0) < 5).length
  }

  // 2. 图表数据
  const chartData = [
    { name: '高活跃 (≥8)', value: categories.high, color: '#ef4444' },
    { name: '中活跃 (5-8)', value: categories.medium, color: '#f59e0b' },
    { name: '低活跃 (<5)', value: categories.low, color: '#3b82f6' }
  ]

  // 3. 自定义标签 (显示百分比)
  const renderLabel = (entry: any) => {
    if (data.length === 0) return '0%'
    const percent = ((entry.value / data.length) * 100).toFixed(1)
    return `${percent}%`
  }

  // 4. 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percent = ((data.value / (chartData.reduce((sum, item) => sum + item.value, 0))) * 100).toFixed(1)
      return (
        <div className="bg-white p-3 rounded shadow-lg border">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm">数量: {data.value}</p>
          <p className="text-sm">占比: {percent}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📊 活跃度分布</CardTitle>
        <p className="text-sm text-gray-500">Bot 活跃度分类统计</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* 统计摘要 */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-bold text-red-600 text-xl">{categories.high}</div>
            <div className="text-gray-500">高活跃</div>
          </div>
          <div>
            <div className="font-bold text-orange-600 text-xl">{categories.medium}</div>
            <div className="text-gray-500">中活跃</div>
          </div>
          <div>
            <div className="font-bold text-blue-600 text-xl">{categories.low}</div>
            <div className="text-gray-500">低活跃</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
