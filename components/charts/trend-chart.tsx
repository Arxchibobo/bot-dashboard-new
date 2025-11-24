'use client'

import { BotInteraction } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrendChartProps {
  data: BotInteraction[]
}

/**
 * 趋势图表组件 - Top 10 热门 Bot 柱状图
 * 显示事件数最多的前10个 Bot
 */
export default function TrendChart({ data }: TrendChartProps) {
  // 1. 取前10个 Bot (按事件数排序)
  const top10Data = data
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 10)

  // 2. 格式化数据供图表使用
  const chartData = top10Data.map(bot => ({
    name: bot.slug_id.length > 20
      ? bot.slug_id.substring(0, 18) + '...'
      : bot.slug_id,
    fullName: bot.slug_id,
    eventCount: bot.eventCount,
    uniqueUsers: bot.uniqueUsers,
    avgActivity: bot.avgActivity
  }))

  // 3. 根据事件数计算颜色 (梯度效果)
  const getColor = (value: number, max: number) => {
    const ratio = value / max
    if (ratio > 0.7) return '#ef4444' // 红色 - 高
    if (ratio > 0.4) return '#f59e0b' // 橙色 - 中
    return '#3b82f6' // 蓝色 - 低
  }

  // 4. 自定义 Tooltip 悬停提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded shadow-lg border">
          <p className="font-semibold mb-1">{data.fullName}</p>
          <p className="text-sm">事件数: {data.eventCount.toLocaleString()}</p>
          <p className="text-sm">用户数: {data.uniqueUsers !== undefined ? data.uniqueUsers.toLocaleString() : 'N/A'}</p>
          <p className="text-sm">活跃度: {data.avgActivity !== undefined ? data.avgActivity.toFixed(1) : 'N/A'}</p>
        </div>
      )
    }
    return null
  }

  const maxValue = chartData.length > 0 ? chartData[0].eventCount : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔥 Top 10 热门 Bot</CardTitle>
        <p className="text-sm text-gray-500">按事件数排序的前10个 Bot</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="eventCount" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry.eventCount, maxValue)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
