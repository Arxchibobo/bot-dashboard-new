import { getDashboardData } from '@/lib/api'
import RevenuePageClient from './page-client'

/**
 * 收入分析页面（服务器组件）
 * 获取初始数据并传递给客户端组件
 */
export default async function RevenuePage() {
  // 服务端获取初始数据（从文件）
  const initialData = await getDashboardData()

  return <RevenuePageClient initialData={initialData} />
}
