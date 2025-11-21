// components/refresh-button.tsx
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 刷新按钮组件
 * 点击后调用 API 刷新数据
 */
export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  /**
   * 处理刷新点击
   */
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)

      // 调用 API 刷新数据
      const response = await fetch('/api/refresh', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // 刷新页面数据
        router.refresh()
        alert('✅ 数据刷新成功！')
      } else {
        alert('❌ 数据刷新失败: ' + (result.message || '未知错误'))
      }
    } catch (error) {
      console.error('刷新数据时出错:', error)
      alert('❌ 数据刷新失败，请稍后重试')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center space-x-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? '刷新中...' : '刷新数据'}</span>
    </Button>
  )
}
