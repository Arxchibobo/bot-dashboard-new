'use client'

import { useState } from 'react'
import { BotInteraction } from '@/lib/types'
import { FilterRanges, getDataRanges } from '@/lib/filter-utils'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

interface AdvancedFilterProps {
  data: BotInteraction[]
  filterRanges: FilterRanges
  onFilterChange: (ranges: FilterRanges) => void
}

/**
 * 高级筛选面板组件
 * 提供精确的范围筛选功能
 */
export default function AdvancedFilter({
  data,
  filterRanges,
  onFilterChange
}: AdvancedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dataRanges = getDataRanges(data)

  // 重置筛选到数据原始范围
  const handleReset = () => {
    onFilterChange(dataRanges)
  }

  // 更新事件数范围
  const handleEventCountChange = (values: number[]) => {
    onFilterChange({
      ...filterRanges,
      eventCount: [values[0], values[1]]
    })
  }

  // 更新用户数范围
  const handleUniqueUsersChange = (values: number[]) => {
    onFilterChange({
      ...filterRanges,
      uniqueUsers: [values[0], values[1]]
    })
  }

  // 更新活跃度范围
  const handleActivityChange = (values: number[]) => {
    onFilterChange({
      ...filterRanges,
      avgActivity: [values[0], values[1]]
    })
  }

  return (
    <div className="border rounded-lg">
      {/* 标题栏 - 可点击折叠/展开 */}
      <div
        className="px-4 py-3 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">🔍 高级筛选</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {/* 筛选面板 */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* 事件数筛选 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">事件数范围</label>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Input
                  type="number"
                  value={filterRanges.eventCount[0]}
                  onChange={(e) => handleEventCountChange([
                    parseInt(e.target.value) || 0,
                    filterRanges.eventCount[1]
                  ])}
                  className="w-20 h-7 text-xs"
                />
                <span>-</span>
                <Input
                  type="number"
                  value={filterRanges.eventCount[1]}
                  onChange={(e) => handleEventCountChange([
                    filterRanges.eventCount[0],
                    parseInt(e.target.value) || dataRanges.eventCount[1]
                  ])}
                  className="w-20 h-7 text-xs"
                />
              </div>
            </div>
            <Slider
              min={dataRanges.eventCount[0]}
              max={dataRanges.eventCount[1]}
              step={10}
              value={[filterRanges.eventCount[0], filterRanges.eventCount[1]]}
              onValueChange={handleEventCountChange}
              className="w-full"
            />
          </div>

          {/* 用户数筛选 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">独立用户数范围</label>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Input
                  type="number"
                  value={filterRanges.uniqueUsers[0]}
                  onChange={(e) => handleUniqueUsersChange([
                    parseInt(e.target.value) || 0,
                    filterRanges.uniqueUsers[1]
                  ])}
                  className="w-20 h-7 text-xs"
                />
                <span>-</span>
                <Input
                  type="number"
                  value={filterRanges.uniqueUsers[1]}
                  onChange={(e) => handleUniqueUsersChange([
                    filterRanges.uniqueUsers[0],
                    parseInt(e.target.value) || dataRanges.uniqueUsers[1]
                  ])}
                  className="w-20 h-7 text-xs"
                />
              </div>
            </div>
            <Slider
              min={dataRanges.uniqueUsers[0]}
              max={dataRanges.uniqueUsers[1]}
              step={5}
              value={[filterRanges.uniqueUsers[0], filterRanges.uniqueUsers[1]]}
              onValueChange={handleUniqueUsersChange}
              className="w-full"
            />
          </div>

          {/* 活跃度筛选 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">平均活跃度范围</label>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Input
                  type="number"
                  value={filterRanges.avgActivity[0].toFixed(1)}
                  onChange={(e) => handleActivityChange([
                    parseFloat(e.target.value) || 0,
                    filterRanges.avgActivity[1]
                  ])}
                  className="w-20 h-7 text-xs"
                  step="0.1"
                />
                <span>-</span>
                <Input
                  type="number"
                  value={filterRanges.avgActivity[1].toFixed(1)}
                  onChange={(e) => handleActivityChange([
                    filterRanges.avgActivity[0],
                    parseFloat(e.target.value) || dataRanges.avgActivity[1]
                  ])}
                  className="w-20 h-7 text-xs"
                  step="0.1"
                />
              </div>
            </div>
            <Slider
              min={dataRanges.avgActivity[0]}
              max={dataRanges.avgActivity[1]}
              step={0.1}
              value={[filterRanges.avgActivity[0], filterRanges.avgActivity[1]]}
              onValueChange={handleActivityChange}
              className="w-full"
            />
          </div>

          {/* 重置按钮 */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>重置筛选</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
