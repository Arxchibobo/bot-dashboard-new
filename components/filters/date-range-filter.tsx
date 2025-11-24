'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getRecentWeekPeriods } from '@/lib/week-utils'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onDateRangeChange: (startDate: string, endDate: string) => void
  onReset?: () => void
}

/**
 * 日期范围筛选组件
 * 允许用户选择起始和结束日期来筛选数据
 */
export default function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
  onReset
}: DateRangeFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate)
  const [localEndDate, setLocalEndDate] = useState(endDate)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)

  // 获取最近6个周期
  const weekPeriods = getRecentWeekPeriods(6)

  useEffect(() => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
    // 检查当前日期是否匹配某个周期
    const matchedPeriod = weekPeriods.find(
      p => p.startDate === startDate && p.endDate === endDate
    )
    setSelectedPeriodId(matchedPeriod?.id || null)
  }, [startDate, endDate])

  const handleApply = () => {
    if (localStartDate && localEndDate) {
      onDateRangeChange(localStartDate, localEndDate)
    }
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
      setSelectedPeriodId(null)
    }
  }

  const handlePeriodSelect = (periodId: string) => {
    const period = weekPeriods.find(p => p.id === periodId)
    if (period) {
      setLocalStartDate(period.startDate)
      setLocalEndDate(period.endDate)
      setSelectedPeriodId(periodId)
      onDateRangeChange(period.startDate, period.endDate)
    }
  }

  // 计算最大日期（今天）
  const maxDate = new Date().toISOString().split('T')[0]
  // 默认最小日期（2025-10-15）
  const minDate = '2025-10-15'

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <p className="text-sm font-medium text-gray-700">时间范围筛选</p>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-gray-500 hover:text-gray-700"
            title="重置为默认范围"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 快捷周期选择 */}
      <div className="space-y-2">
        <label className="text-xs text-gray-600 font-medium">快捷周期（从今天开始，每个9天）</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {weekPeriods.map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriodId === period.id ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect(period.id)}
              className={`text-xs h-auto py-2 px-3 ${
                selectedPeriodId === period.id
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className="text-left w-full">
                <div className="font-medium">{period.label.split(' (')[0]}</div>
                <div className="text-[10px] opacity-80">{period.startDate} ~ {period.endDate}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* 自定义日期选择 */}
      <div className="space-y-2">
        <label className="text-xs text-gray-600 font-medium">自定义日期范围</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">开始日期</label>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => {
                setLocalStartDate(e.target.value)
                setSelectedPeriodId(null) // 清除周期选择
              }}
              min={minDate}
              max={maxDate}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">结束日期</label>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => {
                setLocalEndDate(e.target.value)
                setSelectedPeriodId(null) // 清除周期选择
              }}
              min={localStartDate || minDate}
              max={maxDate}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleApply}
            size="sm"
            disabled={!localStartDate || !localEndDate || localStartDate > localEndDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            应用自定义范围
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t pt-3">
        <p>💡 提示：快捷周期从今天往回推算，每个9天，点击即可快速查询</p>
      </div>
    </div>
  )
}
