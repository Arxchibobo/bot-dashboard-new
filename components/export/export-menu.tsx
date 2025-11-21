'use client'

import { useState } from 'react'
import { BotInteraction } from '@/lib/types'
import { exportToCSV, exportToExcel, getExportStats } from '@/lib/export-utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportMenuProps {
  allData: BotInteraction[]
  filteredData: BotInteraction[]
}

/**
 * 导出菜单组件
 * 提供 CSV 和 Excel 格式的数据导出功能
 */
export default function ExportMenu({ allData, filteredData }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  /**
   * 处理导出操作
   * @param format 导出格式 (csv 或 excel)
   * @param dataType 数据类型 (filtered 或 all)
   */
  const handleExport = async (
    format: 'csv' | 'excel',
    dataType: 'filtered' | 'all'
  ) => {
    setIsExporting(true)

    try {
      const data = dataType === 'filtered' ? filteredData : allData
      const filename = dataType === 'filtered' ? 'bot-data-filtered' : 'bot-data-all'

      // 显示加载提示
      toast.loading('正在准备导出...', { id: 'export-toast' })

      // 模拟异步处理 (给用户反馈时间)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 执行导出
      if (format === 'csv') {
        exportToCSV(data, filename)
      } else {
        exportToExcel(data, filename)
      }

      // 显示成功提示
      const stats = getExportStats(data)
      toast.success(
        `成功导出 ${stats.totalBots} 个 Bot 的数据`,
        { id: 'export-toast', duration: 3000 }
      )
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败,请重试', { id: 'export-toast' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting}
          className="flex items-center space-x-2"
        >
          <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>导出数据</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* 格式选择 */}
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
          选择导出格式
        </div>

        <DropdownMenuItem
          onClick={() => handleExport('csv', 'filtered')}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>导出为 CSV</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel', 'filtered')}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>导出为 Excel</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 数据范围选择 */}
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
          数据范围
        </div>

        <DropdownMenuItem
          onClick={() => handleExport('excel', 'filtered')}
          className="cursor-pointer"
        >
          <div className="flex flex-col">
            <span>当前筛选结果</span>
            <span className="text-xs text-gray-500">
              {filteredData.length} 个 Bot
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel', 'all')}
          className="cursor-pointer"
        >
          <div className="flex flex-col">
            <span>完整数据</span>
            <span className="text-xs text-gray-500">
              {allData.length} 个 Bot
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
