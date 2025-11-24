'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import DateRangeFilter from './filters/date-range-filter'

/**
 * DateRangeFilter 的客户端包装组件
 * 处理 URL 查询参数和路由导航
 */
export default function DateRangeFilterWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 从 URL 获取当前的日期范围，如果没有则使用默认值
  const getDefaultStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() - 7) // 往前推7天
    return date.toISOString().split('T')[0]
  }
  const getDefaultEndDate = () => new Date().toISOString().split('T')[0]

  const startDate = searchParams.get('startDate') || getDefaultStartDate()
  const endDate = searchParams.get('endDate') || getDefaultEndDate()

  /**
   * 处理日期范围变化
   * 通过 URL 参数触发页面重新加载和数据查询
   */
  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    // 更新 URL 查询参数
    const params = new URLSearchParams()
    params.set('startDate', newStartDate)
    params.set('endDate', newEndDate)

    // 导航到新的 URL（会触发服务器端重新获取数据）
    router.push(`/?${params.toString()}`)
  }

  /**
   * 重置为默认日期范围
   */
  const handleReset = () => {
    // 返回首页，移除所有查询参数
    router.push('/')
  }

  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={handleDateRangeChange}
      onReset={handleReset}
    />
  )
}
