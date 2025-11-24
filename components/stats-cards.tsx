// components/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatRelativeTime } from "@/lib/utils"
import { Activity, Users, Bot, Clock, LogIn, UserPlus, UserCheck, DollarSign, TrendingUp, Percent, CreditCard, Zap, FileText } from "lucide-react"
import { LoginStats, RevenueStats } from "@/lib/types"

interface StatsCardsProps {
  totalEvents: number
  totalUsers: number
  botCount: number
  lastUpdate: string
  loginStats?: LoginStats
  revenueStats?: RevenueStats
}

/**
 * 统计卡片组件
 * 展示关键指标：总事件数、独立用户数、Bot 数量、登录用户统计、收入统计、最后更新时间
 */
export default function StatsCards({
  totalEvents,
  totalUsers,
  botCount,
  lastUpdate,
  loginStats,
  revenueStats
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

      {/* 第三行：收入统计 */}
      {revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 总收入卡片 */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">
                总收入
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                ${formatNumber(revenueStats.totalRevenue)}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                {formatNumber(revenueStats.payingUsers)} 付费用户
              </p>
            </CardContent>
          </Card>

          {/* Basic 收入卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Basic 收入
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(revenueStats.basicRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(revenueStats.basicUsers)} 用户
              </p>
            </CardContent>
          </Card>

          {/* Pro 收入卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pro 收入
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(revenueStats.proRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(revenueStats.proUsers)} 用户
              </p>
            </CardContent>
          </Card>

          {/* ARPU 卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ARPU
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueStats.arpu.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                平均每用户收入
              </p>
            </CardContent>
          </Card>

          {/* 收入占比卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Basic 占比
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {revenueStats.totalRevenue > 0
                  ? ((revenueStats.basicRevenue / revenueStats.totalRevenue) * 100).toFixed(1)
                  : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                收入贡献度
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 第四行：收入类型分布 */}
      {revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 订阅收入卡片 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                订阅收入
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                ${formatNumber(revenueStats.subscriptionRevenue)}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {revenueStats.totalRevenue > 0
                  ? ((revenueStats.subscriptionRevenue / revenueStats.totalRevenue) * 100).toFixed(1)
                  : '0'}% 占比
              </p>
            </CardContent>
          </Card>

          {/* 电量包收入卡片 */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">
                电量包收入
              </CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                ${formatNumber(revenueStats.energyRevenue)}
              </div>
              <p className="text-xs text-green-700 mt-1">
                {revenueStats.totalRevenue > 0
                  ? ((revenueStats.energyRevenue / revenueStats.totalRevenue) * 100).toFixed(1)
                  : '0'}% 占比
              </p>
            </CardContent>
          </Card>

          {/* 文章收入卡片 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">
                文章收入
              </CardTitle>
              <FileText className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                ${formatNumber(revenueStats.articleRevenue)}
              </div>
              <p className="text-xs text-amber-700 mt-1">
                {revenueStats.totalRevenue > 0
                  ? ((revenueStats.articleRevenue / revenueStats.totalRevenue) * 100).toFixed(1)
                  : '0'}% 占比
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
