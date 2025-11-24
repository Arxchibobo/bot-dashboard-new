import { getDashboardData } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import BotTable from '@/components/bot-table'
import DataActions from '@/components/data-actions'
import { BotsPageClient } from './page-client'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Bot 交互详情页面
 * 展示 Bot 数据表格和筛选功能
 * 支持从图表页面跳转并应用筛选
 */
export default async function BotsPage({ searchParams }: PageProps) {
  // 获取查询参数
  const startDate = typeof searchParams?.startDate === 'string' ? searchParams.startDate : undefined
  const endDate = typeof searchParams?.endDate === 'string' ? searchParams.endDate : undefined
  const filter = typeof searchParams?.filter === 'string' ? searchParams.filter : undefined

  // 服务端获取数据
  const data = await getDashboardData(startDate, endDate)

  // 过滤掉 TOTAL 数据（TOTAL 是汇总统计，不是实际的 Bot）
  const botsWithoutTotal = data.bots.filter(bot => bot.slug_id !== 'TOTAL')

  return (
    <div className="space-y-6">
      {/* 页面头部卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-2xl">Bot 交互详情</CardTitle>
              <CardDescription className="mt-2">
                共 <span className="font-semibold text-blue-600 dark:text-blue-400">{botsWithoutTotal.length}</span> 个 Bot
                | 总事件: <span className="font-semibold text-purple-600 dark:text-purple-400">{data.totalEvents.toLocaleString()}</span>
                | 总用户: <span className="font-semibold text-green-600 dark:text-green-400">{data.totalUsers.toLocaleString()}</span>
              </CardDescription>
            </div>
            <DataActions
              allData={botsWithoutTotal}
              filteredData={botsWithoutTotal}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Bot 数据表格（使用客户端组件处理筛选） */}
      <BotsPageClient bots={botsWithoutTotal} initialFilter={filter} />
    </div>
  )
}
