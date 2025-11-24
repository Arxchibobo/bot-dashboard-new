'use client'

import { useState, useEffect } from 'react'
import { DashboardData } from '@/lib/types'
import StatsCards from '@/components/stats-cards'
import DashboardWrapper from '@/components/dashboard-wrapper'
import DateRangeFilter from '@/components/filters/date-range-filter'
import FunnelChart from '@/components/funnel-chart'
import RevenueChart from '@/components/charts/revenue-chart'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// 默认日期范围：最近7天
const getDefaultStartDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7) // 往前推7天
  return date.toISOString().split('T')[0]
}
const getDefaultEndDate = () => new Date().toISOString().split('T')[0]

/**
 * 主页面客户端组件
 * 支持动态日期范围筛选
 */
export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())

  // 获取数据的函数
  const fetchData = async (start: string, end: string) => {
    setLoading(true)

    // 设置超时提示
    const timeoutId = setTimeout(() => {
      toast.loading('查询时间较长，请耐心等待...', { duration: 3000 })
    }, 3000)

    try {
      console.log(`🔄 正在获取数据: ${start} 至 ${end}`)

      const response = await fetch(`/api/data?startDate=${start}&endDate=${end}`, {
        signal: AbortSignal.timeout(90000) // 90秒超时
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        console.log(`✅ 数据加载成功: ${result.data.bots.length} 个 Bot`)

        // 检查是否Bot数据加载失败（但其他数据成功）
        if (result.botDataFailed) {
          toast.error('Bot数据查询超时，仅显示登录统计和用户漏斗数据。请尝试缩小时间范围。', {
            duration: 6000
          })
        } else {
          // 检查是否因为时间范围过长而限制了Bot数量
          if (result.limitReduced) {
            toast(`时间范围较长，仅显示前 ${result.data.bots.length} 个活跃 Bot`, {
              icon: 'ℹ️',
              duration: 5000
            })
          }
        }

        // 检查是否有部分数据缺失
        if (!result.data.loginStats) {
          toast('登录统计数据加载失败', { icon: '⚠️' })
        }
        if (!result.data.userFunnel) {
          toast('用户漏斗数据加载失败', { icon: '⚠️' })
        }
      } else {
        console.error('❌ 数据加载失败:', result.message)
        toast.error(result.message || '数据加载失败，请缩小时间范围重试')

        // 设置空数据
        setData({
          lastUpdate: new Date().toISOString(),
          totalEvents: 0,
          totalUsers: 0,
          bots: []
        })
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ 数据获取异常:', error)

      if (error instanceof Error && error.name === 'TimeoutError') {
        toast.error('查询超时，请缩小时间范围后重试')
      } else {
        toast.error('数据获取失败，请重试')
      }

      // 设置空数据
      setData({
        lastUpdate: new Date().toISOString(),
        totalEvents: 0,
        totalUsers: 0,
        bots: []
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchData(startDate, endDate)
  }, []) // 只在组件挂载时执行

  // 处理日期范围变化
  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
    fetchData(newStartDate, newEndDate)
    toast.success('正在更新数据...')
  }

  // 重置日期范围（重置为最近7天）
  const handleReset = () => {
    const defaultStart = getDefaultStartDate()
    const defaultEnd = getDefaultEndDate()
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    fetchData(defaultStart, defaultEnd)
    toast.success('已重置为最近7天')
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">正在加载数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 日期范围筛选 */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onReset={handleReset}
      />

      {/* 统计卡片 */}
      <StatsCards
        totalEvents={data.totalEvents}
        totalUsers={data.totalUsers}
        botCount={data.bots.length}
        lastUpdate={data.lastUpdate}
        loginStats={data.loginStats}
        revenueStats={data.revenueStats}
      />

      {/* 用户行为转化漏斗 */}
      {data.userFunnel && (
        <FunnelChart funnel={data.userFunnel} />
      )}

      {/* 收入趋势图表 */}
      {data.dailyRevenue && data.dailyRevenue.length > 0 && (
        <RevenueChart dailyRevenue={data.dailyRevenue} />
      )}

      {/* 图表和表格（包含交互逻辑） */}
      <DashboardWrapper
        bots={data.bots}
        lastUpdate={data.lastUpdate}
        totalEvents={data.totalEvents}
        totalUsers={data.totalUsers}
      />
    </div>
  )
}
