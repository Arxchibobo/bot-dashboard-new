'use client'

import { BotInteraction } from '@/lib/types'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScatterChartCompProps {
  data: BotInteraction[]
}

/**
 * 散点图组件 - 用户数 vs 事件数
 * 点的大小表示平均活跃度
 */
export default function ScatterChartComp({ data }: ScatterChartCompProps) {
  // 1. 格式化数据 (只取前50个避免过于拥挤)
  const chartData = data
    .slice(0, 50)
    .map(bot => ({
      x: bot.uniqueUsers,
      y: bot.eventCount,
      z: bot.avgActivity * 10, // 控制点的大小
      name: bot.slug_id
    }))

  // 2. 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded shadow-lg border">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm">用户数: {data.x.toLocaleString()}</p>
          <p className="text-sm">事件数: {data.y.toLocaleString()}</p>
          <p className="text-sm">活跃度: {(data.z / 10).toFixed(1)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📈 用户数 vs 事件数</CardTitle>
        <p className="text-sm text-gray-500">点的大小表示平均活跃度</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="独立用户数"
              label={{ value: '独立用户数', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="事件数"
              label={{ value: '事件数', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            <Scatter
              name="Bot"
              data={chartData}
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
