// components/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatRelativeTime } from "@/lib/utils"
import { Activity, Users, Bot, Clock, LogIn, UserPlus, UserCheck } from "lucide-react"
import { LoginStats } from "@/lib/types"

interface StatsCardsProps {
  totalEvents: number
  totalUsers: number
  botCount: number
  lastUpdate: string
  loginStats?: LoginStats
}

/**
 * 统计卡片组件
 * 展示关键指标：总事件数、独立用户数、Bot 数量、登录用户统计、最后更新时间
 */
export default function StatsCards({
  totalEvents,
  totalUsers,
  botCount,
  lastUpdate,
  loginStats
}: StatsCardsProps) {
  return (
    <div className="space-y-4">
      {/* 第一行：基础统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总事件数卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总事件数
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalEvents)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所选时间范围
            </p>
          </CardContent>
        </Card>

        {/* 独立用户数卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              独立用户数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalUsers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              唯一访客
            </p>
          </CardContent>
        </Card>

        {/* Bot 数量卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bot 数量
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(botCount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              活跃 Bot
            </p>
          </CardContent>
        </Card>

        {/* 最后更新时间卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              最后更新
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRelativeTime(lastUpdate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              数据新鲜度
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：登录用户统计 */}
      {loginStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 登录用户总数卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                登录用户数
              </CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(loginStats.uniqueLoginUsers)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(loginStats.totalLogins)} 次登录
              </p>
            </CardContent>
          </Card>

          {/* 新用户卡片 */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">
                新用户
              </CardTitle>
              <UserPlus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatNumber(loginStats.newUsers)}</div>
              <p className="text-xs text-green-700 mt-1">
                首次登录用户
              </p>
            </CardContent>
          </Card>

          {/* 老用户卡片 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                回访用户
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatNumber(loginStats.returningUsers)}</div>
              <p className="text-xs text-blue-700 mt-1">
                之前已登录过
              </p>
            </CardContent>
          </Card>

          {/* 新用户占比卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                新用户占比
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loginStats.uniqueLoginUsers > 0
                  ? `${Math.round((loginStats.newUsers / loginStats.uniqueLoginUsers) * 100)}%`
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                新用户比例
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
