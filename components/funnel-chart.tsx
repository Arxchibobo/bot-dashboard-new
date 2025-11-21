'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserFunnel } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { TrendingDown, Users, Target } from "lucide-react"

interface FunnelChartProps {
  funnel: UserFunnel
}

/**
 * 用户行为漏斗图组件
 * 展示用户从认证到分享的完整行为路径及各步骤转化率
 */
export default function FunnelChart({ funnel }: FunnelChartProps) {
  // 计算最大宽度（用于漏斗图的宽度比例）
  const maxCount = funnel.steps[0]?.userDayCount || 1

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold">用户行为转化漏斗</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            统计口径：同一用户在同一天内的完整行为路径
          </p>
        </div>
        <Target className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.steps.map((step, index) => {
            // 计算漏斗宽度（百分比）
            const widthPercent = maxCount > 0 ? (step.userDayCount / maxCount) * 100 : 0

            // 计算流失人数
            const dropCount = index > 0
              ? funnel.steps[index - 1].userDayCount - step.userDayCount
              : 0
            const dropPercent = index > 0
              ? 100 - step.conversionRate
              : 0

            return (
              <div key={step.eventType} className="space-y-2">
                {/* 步骤信息 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">
                      {index + 1}. {step.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({step.eventType})
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {formatNumber(step.userDayCount)}
                      </span>
                      <span className="text-gray-500 text-xs">人次</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-green-600" />
                      <span className="font-semibold text-green-900">
                        {step.conversionRate.toFixed(2)}%
                      </span>
                      <span className="text-gray-500 text-xs">转化</span>
                    </div>
                  </div>
                </div>

                {/* 漏斗条形图 */}
                <div className="relative">
                  <div
                    className="h-12 rounded-md flex items-center justify-between px-4 transition-all duration-300"
                    style={{
                      width: `${Math.max(widthPercent, 10)}%`,
                      background: `linear-gradient(to right,
                        ${index === 0 ? '#3b82f6' : '#60a5fa'},
                        ${index === funnel.steps.length - 1 ? '#1e40af' : '#2563eb'}
                      )`
                    }}
                  >
                    <span className="text-white font-medium text-sm">
                      {step.name}
                    </span>
                    <span className="text-white font-bold">
                      {step.overallConversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 流失信息 */}
                {index > 0 && dropCount > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-red-600 ml-4">
                    <TrendingDown className="h-3 w-3" />
                    <span>
                      流失 {formatNumber(dropCount)} 人次 ({dropPercent.toFixed(2)}%)
                    </span>
                  </div>
                )}

                {/* 分隔线 */}
                {index < funnel.steps.length - 1 && (
                  <div className="h-6 flex items-center ml-4">
                    <div className="w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-200"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 漏斗总结 */}
        <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">漏斗入口</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(funnel.totalUserDays)}
            </p>
            <p className="text-xs text-gray-500">人次进入</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">最终转化</p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(funnel.steps[funnel.steps.length - 1]?.userDayCount || 0)}
            </p>
            <p className="text-xs text-gray-500">完成全流程</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">整体转化率</p>
            <p className="text-2xl font-bold text-purple-600">
              {funnel.steps[funnel.steps.length - 1]?.overallConversionRate.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">从入口到出口</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
