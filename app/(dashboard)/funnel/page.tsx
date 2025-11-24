import { getDashboardData } from '@/lib/api'
import FunnelPageClient from './page-client'

/**
 * 用户漏斗页面（服务器组件）
 * 获取初始数据并传递给客户端组件
 */
export default async function FunnelPage() {
  // 服务端获取初始数据（从文件）
  const initialData = await getDashboardData()

  return <FunnelPageClient initialData={initialData} />
}
