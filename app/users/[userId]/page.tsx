// app/users/[userId]/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Activity, Calendar, MessageSquare } from 'lucide-react'

interface UserPageProps {
  params: {
    userId: string
  }
}

/**
 * 用户详情页面（占位页面）
 * TODO: 后续需要接入真实的用户数据 API
 */
export default function UserPage({ params }: UserPageProps) {
  const { userId } = params

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回仪表盘
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">用户详情</h1>
          <p className="text-gray-500 mt-2">用户 ID: {userId}</p>
        </div>

        {/* 占位提示卡片 */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  🚧 页面正在开发中
                </h3>
                <p className="text-sm text-blue-700">
                  此页面为占位页面。未来将展示该用户的详细交互数据、活动历史和使用的 Bot 列表。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 计划功能预览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 用户基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>用户 ID:</span>
                  <span className="font-mono text-gray-900">{userId}</span>
                </div>
                <div className="flex justify-between">
                  <span>首次活动:</span>
                  <span className="text-gray-400">待加载</span>
                </div>
                <div className="flex justify-between">
                  <span>最后活动:</span>
                  <span className="text-gray-400">待加载</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 活动统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                活动统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>总事件数:</span>
                  <span className="text-gray-400">待加载</span>
                </div>
                <div className="flex justify-between">
                  <span>使用的 Bot 数:</span>
                  <span className="text-gray-400">待加载</span>
                </div>
                <div className="flex justify-between">
                  <span>活跃天数:</span>
                  <span className="text-gray-400">待加载</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 交互历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                最近交互
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-500">
                <p className="text-center py-4">暂无交互记录</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bot 使用列表占位 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>使用的 Bot 列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>用户的 Bot 使用记录将在此处显示</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 生成元数据
 */
export function generateMetadata({ params }: UserPageProps) {
  return {
    title: `用户 ${params.userId} - Bot Dashboard`,
    description: `查看用户 ${params.userId} 的详细交互数据和活动历史`
  }
}
