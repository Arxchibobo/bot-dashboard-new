// components/data-actions.tsx
'use client'

import { useState } from 'react'
import { BotInteraction } from '@/lib/types'
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ExportMenu from './export/export-menu'
import { Toaster } from 'react-hot-toast'

interface DataActionsProps {
  allData: BotInteraction[]
  filteredData: BotInteraction[]
}

/**
 * 数据操作按钮组件
 * 包含：重新加载数据、从 Honeycomb 更新、导出数据
 */
export default function DataActions({ allData, filteredData }: DataActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  /**
   * 重新加载数据（从本地文件）
   */
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      setMessage('')

      // 调用 API 刷新数据
      const response = await fetch('/api/refresh', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // 刷新页面数据
        router.refresh()
        setMessage('✅ 数据重新加载成功！')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('❌ 重新加载失败: ' + (result.message || '未知错误'))
      }
    } catch (error) {
      console.error('重新加载数据时出错:', error)
      setMessage('❌ 重新加载失败，请稍后重试')
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * 从 Honeycomb 更新数据
   * 直接通过后端 API 调用 MCP 查询 Honeycomb
   */
  const handleUpdateFromHoneycomb = async () => {
    try {
      setIsUpdating(true)
      setMessage('正在从 Honeycomb 获取最新数据...')

      // 调用后端 API，通过 MCP 查询 Honeycomb
      const response = await fetch('/api/refresh', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // 刷新页面数据
        router.refresh()
        setMessage(`✅ ${result.message}`)
        setTimeout(() => setMessage(''), 5000)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      console.error('更新数据时出错:', error)
      setMessage(
        '❌ 自动更新失败，请稍后重试\n\n' +
        '或使用手动方式：复制指令"请刷新 bot-dashboard 数据"到 Claude Code 执行'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {/* 按钮组 */}
      <div className="flex space-x-3">
        {/* 重新加载按钮 */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isUpdating}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '加载中...' : '重新加载数据'}</span>
        </Button>

        {/* Honeycomb 更新按钮 */}
        <Button
          onClick={handleUpdateFromHoneycomb}
          disabled={isRefreshing || isUpdating}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className={`h-4 w-4 ${isUpdating ? 'animate-bounce' : ''}`} />
          <span>{isUpdating ? '更新中...' : '从 Honeycomb 更新'}</span>
        </Button>

        {/* 导出菜单 */}
        <ExportMenu
          allData={allData}
          filteredData={filteredData}
        />
      </div>

      {/* Toast 通知容器 */}
      <Toaster position="top-right" />

      {/* 消息提示 */}
      {message && (
        <div className={`text-sm px-3 py-1 rounded ${
          message.startsWith('✅')
            ? 'bg-green-100 text-green-800'
            : message.startsWith('❌')
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
