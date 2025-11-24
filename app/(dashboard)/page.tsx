import { getDashboardData } from '@/lib/api'
import OverviewPageClient from './page-client'

/**
 * 数据概览页面（服务器组件）
 * 获取初始数据并传递给客户端组件
 */
export default async function OverviewPage() {
  // 服务端获取初始数据（从文件）
  const initialData = await getDashboardData()

  return <OverviewPageClient initialData={initialData} />
}
