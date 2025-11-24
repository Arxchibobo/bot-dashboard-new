'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardData } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import RevenueChart from '@/components/charts/revenue-chart'
import DateRangeFilterWrapper from '@/components/date-range-filter-wrapper'
import { DollarSign, TrendingUp, Users, Percent, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface RevenuePageClientProps {
  initialData: DashboardData
}

/**
 * 收入分析页面客户端组件
 * 处理时间筛选和数据加载
 */
export default function RevenuePageClient({ initialData }: RevenuePageClientProps) {
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
      // 无时间参数时，使用默认的7天时间范围自动查询
      const defaultEndDate = new Date().toISOString().split('T')[0]
      const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      fetchData(defaultStartDate, defaultEndDate)
    }
  }, [startDate, endDate])

  const fetchData = async (start: string, end: string) => {
    setLoading(true)

    const timeoutId = setTimeout(() => {
      toast.loading('查询时间较长，请耐心等待...', { duration: 3000 })
    }, 3000)

    try {
      const response = await fetch(`/api/data?startDate=${start}&endDate=${end}`, {
        signal: AbortSignal.timeout(90000)
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        console.log(`✅ 收入数据加载成功`)
      } else {
        toast.error(result.message || '数据加载失败')
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ 数据获取异常:', error)
      toast.error('数据获取失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 检查是否有收入数据
  const hasRevenueData = data.revenueStats && data.dailyRevenue && data.dailyRevenue.length > 0

  return (
    <div className="space-y-8">
      {/* 页面头部 + 时间筛选 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            收入分析
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
          <span className="ml-3 text-gray-600 dark:text-gray-400">加载收入数据中...</span>
        </div>
      )}

      {/* 无数据提示 */}
      {!loading && !hasRevenueData && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              暂无收入数据
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              请使用时间筛选器查询特定时间范围的收入数据
            </p>
          </CardContent>
        </Card>
      )}

      {/* 收入数据展示 */}
      {!loading && hasRevenueData && (
        <>
          {/* 收入统计卡片 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 总收入卡片 */}
            <Card className="hover:shadow-lg transition-shadow dark:hover:shadow-blue-900/20">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  总收入
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  ${data.revenueStats!.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* ARPU 卡片 */}
            <Card className="hover:shadow-lg transition-shadow dark:hover:shadow-blue-900/20">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  ARPU
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ${data.revenueStats!.arpu.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* ARPPU 卡片 */}
            <Card className="hover:shadow-lg transition-shadow dark:hover:shadow-blue-900/20">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  ARPPU
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${data.revenueStats!.arppu.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* 付费用户卡片 */}
            <Card className="hover:shadow-lg transition-shadow dark:hover:shadow-blue-900/20">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  付费用户
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {data.revenueStats!.payingUsers.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 收入趋势图表 */}
          <RevenueChart dailyRevenue={data.dailyRevenue!} />
        </>
      )}
    </div>
  )
}
