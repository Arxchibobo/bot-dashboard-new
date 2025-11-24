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
    <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">时间范围筛选</p>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="重置为默认范围"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 快捷周期选择 - 横向排列 */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">快捷周期（每个9天）</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
          {weekPeriods.map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriodId === period.id ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect(period.id)}
              className={`text-xs h-auto py-1.5 px-2 ${
                selectedPeriodId === period.id
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-gray-800'
              }`}
            >
              <div className="text-center w-full">
                <div className="font-medium text-[11px]">{period.label.split(' (')[0]}</div>
                <div className="text-[9px] opacity-75 leading-tight mt-0.5">
                  {period.startDate.slice(5)} ~ {period.endDate.slice(5)}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* 自定义日期选择 - 单行内联布局 */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">自定义范围</label>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => {
                setLocalStartDate(e.target.value)
                setSelectedPeriodId(null)
              }}
              min={minDate}
              max={maxDate}
              className="text-xs h-8 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => {
                setLocalEndDate(e.target.value)
                setSelectedPeriodId(null)
              }}
              min={localStartDate || minDate}
              max={maxDate}
              className="text-xs h-8 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <Button
            onClick={handleApply}
            size="sm"
            disabled={!localStartDate || !localEndDate || localStartDate > localEndDate}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 h-8 px-3 text-xs"
          >
            应用
          </Button>
        </div>
      </div>

      <div className="text-[10px] text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2">
        💡 快捷周期从今天往回推算，点击即可快速查询
      </div>
    </div>
  )
}
