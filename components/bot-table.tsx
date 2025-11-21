// components/bot-table.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { BotInteraction } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Search, ChevronRight, ChevronDown } from 'lucide-react'
import PresetFilters from './filters/preset-filters'
import AdvancedFilter from './filters/advanced-filter'
import UserIdsList from './user-ids-list'
import { FilterRanges, getDataRanges, getPresetFilter, applyFilter, PresetFilter } from '@/lib/filter-utils'

interface BotTableProps {
  data: BotInteraction[]
  onFilteredDataChange?: (data: BotInteraction[]) => void
  externalFilterTrigger?: PresetFilter | null  // 外部触发的筛选器
  onFilterApplied?: () => void                   // 筛选应用后的回调
}

type SortField = 'slug_id' | 'eventCount' | 'uniqueUsers' | 'avgActivity'
type SortOrder = 'asc' | 'desc'

/**
 * Bot 交互数据表格组件
 * 支持排序、搜索、筛选和分页功能
 */
export default function BotTable({
  data,
  onFilteredDataChange,
  externalFilterTrigger,
  onFilterApplied
}: BotTableProps) {
  // 搜索关键词
  const [searchTerm, setSearchTerm] = useState('')
  // 排序字段
  const [sortField, setSortField] = useState<SortField>('eventCount')
  // 排序顺序
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  // 当前页码
  const [currentPage, setCurrentPage] = useState(1)
  // 每页显示数量
  const pageSize = 20
  // 预设筛选器状态
  const [activePreset, setActivePreset] = useState<PresetFilter>('all')
  // 筛选范围
  const [filterRanges, setFilterRanges] = useState<FilterRanges>(() => getDataRanges(data))
  // 展开的行集合（使用 slug_id 作为标识）
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // 当原始数据变化时重新计算筛选范围
  useEffect(() => {
    setFilterRanges(getDataRanges(data))
  }, [data])

  // 监听外部触发的筛选器
  useEffect(() => {
    if (externalFilterTrigger) {
      handlePresetFilter(externalFilterTrigger)
      onFilterApplied?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFilterTrigger])

  /**
   * 切换行的展开/收起状态
   */
  const toggleRowExpansion = (slugId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(slugId)) {
        next.delete(slugId)
      } else {
        next.add(slugId)
      }
      return next
    })
  }

  /**
   * 处理排序点击
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果点击的是当前排序字段，则切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 否则设置新的排序字段，默认降序
      setSortField(field)
      setSortOrder('desc')
    }
  }

  /**
   * 处理预设筛选器变化
   */
  const handlePresetFilter = (preset: PresetFilter) => {
    setActivePreset(preset)
    const dataRanges = getDataRanges(data)
    const newRanges = getPresetFilter(preset, dataRanges)
    setFilterRanges(newRanges)
    setCurrentPage(1) // 重置到第一页
  }

  /**
   * 过滤和排序后的数据
   */
  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // 1. 应用范围筛选
    result = applyFilter(result, filterRanges)

    // 2. 应用搜索过滤
    if (searchTerm) {
      result = result.filter(bot =>
        bot.slug_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 3. 应用排序
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // 处理 undefined 值：undefined 排在最后
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    return result
  }, [data, filterRanges, searchTerm, sortField, sortOrder])

  // 通知父组件筛选后的数据
  useEffect(() => {
    onFilteredDataChange?.(filteredAndSortedData)
  }, [filteredAndSortedData, onFilteredDataChange])

  /**
   * 分页数据
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage])

  /**
   * 总页数
   */
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  /**
   * 渲染排序图标
   */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="space-y-4 p-6">
      {/* 预设筛选按钮 */}
      <PresetFilters
        activeFilter={activePreset}
        onFilterChange={handlePresetFilter}
      />

      {/* 高级筛选面板 */}
      <AdvancedFilter
        data={data}
        filterRanges={filterRanges}
        onFilterChange={(ranges) => {
          setFilterRanges(ranges)
          setActivePreset('all') // 清除预设状态
          setCurrentPage(1)
        }}
      />

      {/* 搜索栏 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索 Slug ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // 搜索时重置到第一页
            }}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          共 {filteredAndSortedData.length} 条数据
        </div>
      </div>

      {/* 数据表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* 展开按钮列 */}
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[300px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('slug_id')}
                  className="hover:bg-gray-100"
                >
                  Slug ID
                  {renderSortIcon('slug_id')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('eventCount')}
                  className="hover:bg-gray-100"
                >
                  事件数
                  {renderSortIcon('eventCount')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('uniqueUsers')}
                  className="hover:bg-gray-100"
                >
                  独立用户数
                  {renderSortIcon('uniqueUsers')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('avgActivity')}
                  className="hover:bg-gray-100"
                >
                  平均活跃度
                  {renderSortIcon('avgActivity')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {searchTerm ? '未找到匹配的数据' : '暂无数据'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((bot) => {
                const isExpanded = expandedRows.has(bot.slug_id)
                const hasUserIds = bot.userIds && bot.userIds.length > 0

                return (
                  <React.Fragment key={bot.slug_id}>
                    {/* 主数据行 */}
                    <TableRow className={isExpanded ? 'border-b-0' : ''}>
                      {/* 展开按钮列 */}
                      <TableCell className="w-[50px]">
                        {hasUserIds && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(bot.slug_id)}
                            className="h-8 w-8 p-0"
                            title={isExpanded ? '收起用户列表' : '展开用户列表'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{bot.slug_id}</TableCell>
                      <TableCell className="text-right">{formatNumber(bot.eventCount)}</TableCell>
                      <TableCell className="text-right">
                        {bot.uniqueUsers !== undefined ? formatNumber(bot.uniqueUsers) : <span className="text-gray-400">N/A</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {bot.avgActivity !== undefined ? bot.avgActivity.toFixed(1) : <span className="text-gray-400">N/A</span>}
                      </TableCell>
                    </TableRow>

                    {/* 展开的用户列表行 */}
                    {isExpanded && hasUserIds && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0 bg-gray-50">
                          <UserIdsList
                            userIds={bot.userIds!}
                            botSlugId={bot.slug_id}
                            totalUsers={bot.uniqueUsers || 0}
                            sampleSize={bot.userIdsSampleSize}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
