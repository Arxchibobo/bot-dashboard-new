'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardData } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import FunnelChart from '@/components/funnel-chart'
import DateRangeFilterWrapper from '@/components/date-range-filter-wrapper'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface FunnelPageClientProps {
  initialData: DashboardData
}

/**
 * 用户漏斗页面客户端组件
 * 处理时间筛选和数据加载
 */
export default function FunnelPageClient({ initialData }: FunnelPageClientProps) {
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
        console.log(`✅ 漏斗数据加载成功`)
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

  // 检查是否有漏斗数据
  const hasFunnelData = data.userFunnel && data.userFunnel.steps && data.userFunnel.steps.length > 0

  return (
    <div className="space-y-8">
      {/* 页面头部 + 时间筛选 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            用户转化漏斗
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            追踪用户从注册到生成的完整路径
          </p>
        </div>

        {/* 时间范围筛选器 */}
        <DateRangeFilterWrapper />
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">加载漏斗数据中...</span>
        </div>
      )}

      {/* 无数据提示 */}
      {!loading && !hasFunnelData && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              暂无漏斗数据
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              请使用时间筛选器查询特定时间范围的用户转化数据
            </p>
          </CardContent>
        </Card>
      )}

      {/* 漏斗数据展示 */}
      {!loading && hasFunnelData && (
        <FunnelChart funnel={data.userFunnel!} />
      )}
    </div>
  )
}
