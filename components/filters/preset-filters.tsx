'use client'

import { Button } from '@/components/ui/button'
import { PresetFilter } from '@/lib/filter-utils'
import { Flame, Zap, Star, Users, Grid3X3 } from 'lucide-react'

interface PresetFiltersProps {
  activeFilter: PresetFilter
  onFilterChange: (filter: PresetFilter) => void
}

/**
 * 预设筛选按钮组组件
 * 提供快速筛选常用场景的按钮
 */
export default function PresetFilters({
  activeFilter,
  onFilterChange
}: PresetFiltersProps) {
  const filters = [
    {
      id: 'all' as PresetFilter,
      label: '全部 Bot',
      icon: Grid3X3,
      description: '显示所有数据'
    },
    {
      id: 'hot' as PresetFilter,
      label: '热门',
      icon: Flame,
      description: '事件数 > 1000'
    },
    {
      id: 'high-activity' as PresetFilter,
      label: '高活跃',
      icon: Zap,
      description: '活跃度 > 8'
    },
    {
      id: 'emerging' as PresetFilter,
      label: '新兴潜力',
      icon: Star,
      description: '用户数 < 100 且活跃度 > 7'
    },
    {
      id: 'popular' as PresetFilter,
      label: '大众化',
      icon: Users,
      description: '用户数 > 500'
    }
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">快速筛选:</p>
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id

          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={`flex items-center space-x-1 ${
                isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
              title={filter.description}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
