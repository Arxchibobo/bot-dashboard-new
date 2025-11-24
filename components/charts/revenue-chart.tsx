'use client'

/**
 * 收入趋势图表组件
 * 显示每日收入折线图和收入类型堆叠柱状图
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyRevenue } from "@/lib/types"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from "@/lib/utils"

interface RevenueChartProps {
  dailyRevenue: DailyRevenue[]
}

/**
 * 自定义 Tooltip 组件
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function RevenueChart({ dailyRevenue }: RevenueChartProps) {
  // 按日期排序（从旧到新）
  const sortedData = [...dailyRevenue].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  // 格式化日期显示（只显示月-日）
  const formattedData = sortedData.map(item => ({
    ...item,
    displayDate: item.date.substring(5) // 显示 MM-DD
  }))

  return (
    <div className="space-y-6">
      {/* 收入趋势折线图 */}
      <Card>
        <CardHeader>
          <CardTitle>收入趋势</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            每日收入变化趋势（折线图）
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${formatNumber(value)}`}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="总收入"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="basicRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Basic 收入"
                dot={{ fill: '#3b82f6', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="proRevenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Pro 收入"
                dot={{ fill: '#10b981', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 收入类型堆叠柱状图 */}
      <Card>
        <CardHeader>
          <CardTitle>收入类型分布</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            每日各收入类型占比（堆叠柱状图）
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${formatNumber(value)}`}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar
                dataKey="basicRevenue"
                stackId="a"
                fill="#3b82f6"
                name="Basic 订阅"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="proRevenue"
                stackId="a"
                fill="#10b981"
                name="Pro 订阅"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="energyRevenue"
                stackId="a"
                fill="#f59e0b"
                name="电量包"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="articleRevenue"
                stackId="a"
                fill="#ef4444"
                name="文章"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 统计摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>收入数据摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">总天数</p>
              <p className="text-2xl font-bold text-gray-900">{sortedData.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">总收入</p>
              <p className="text-2xl font-bold text-purple-600">
                ${formatNumber(sortedData.reduce((sum, item) => sum + item.totalRevenue, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">日均收入</p>
              <p className="text-2xl font-bold text-blue-600">
                ${formatNumber(sortedData.reduce((sum, item) => sum + item.totalRevenue, 0) / sortedData.length)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">总订单数</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(sortedData.reduce((sum, item) => sum + item.orderCount, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
