'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardData } from '@/lib/types'
import StatsCards from '@/components/stats-cards'
import ChartsSection from '@/components/charts/charts-section'
import FunnelChart from '@/components/funnel-chart'
import RevenueChart from '@/components/charts/revenue-chart'
import DateRangeFilterWrapper from '@/components/date-range-filter-wrapper'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface OverviewPageClientProps {
  initialData: DashboardData
}

/**
 * 数据概览页面客户端组件
 * 处理时间筛选和数据加载
 */
export default function OverviewPageClient({ initialData }: OverviewPageClientProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(false)

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // 当 URL 参数变化时，重新获取数据
  useEffect(() => {
    if (startDate && endDate) {
      fetchData(startDate, endDate)
    } else {
      // 无时间参数时，使用默认的7天时间范围自动查询（这样可以获取收入和漏斗数据）
      const defaultEndDate = new Date().toISOString().split('T')[0]
      const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      fetchData(defaultStartDate, defaultEndDate)
    }
  }, [startDate, endDate])

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
        } else if (result.limitReduced) {
          toast(`时间范围较长，仅显示前 ${result.data.bots.length} 个活跃 Bot`, {
            icon: 'ℹ️',
            duration: 5000
          })
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
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ 数据获取异常:', error)

      if (error instanceof Error && error.name === 'TimeoutError') {
        toast.error('查询超时，请缩小时间范围后重试')
      } else {
        toast.error('数据获取失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 页面头部 + 时间筛选 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            数据概览
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            最后更新: {new Date(data.lastUpdate).toLocaleString('zh-CN')}
          </p>
        </div>

        {/* 时间范围筛选器 */}
        <DateRangeFilterWrapper />
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">加载数据中...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* 统计卡片 */}
          <StatsCards
            totalEvents={data.totalEvents}
            totalUsers={data.totalUsers}
            botCount={data.bots.length}
            lastUpdate={data.lastUpdate}
            loginStats={data.loginStats}
            revenueStats={data.revenueStats}
          />

          {/* 收入图表 */}
          {data.dailyRevenue && data.dailyRevenue.length > 0 && (
            <RevenueChart dailyRevenue={data.dailyRevenue} />
          )}

          {/* 用户漏斗图表 */}
          {data.userFunnel && (
            <FunnelChart funnel={data.userFunnel} />
          )}

          {/* Bot 交互图表区域 - 过滤掉 TOTAL 数据 */}
          <ChartsSection data={data.bots.filter(bot => bot.slug_id !== 'TOTAL')} />
        </>
      )}
    </div>
  )
}
