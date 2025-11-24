'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 顶部导航栏组件
 * 包含应用标题、全局操作按钮和主题切换
 */
export function TopNav() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* 左侧：应用标题 */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bot Dashboard
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              交互数据分析平台
            </p>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="rounded-full"
            aria-label="刷新数据"
          >
            <RefreshCw className="h-[1.1rem] w-[1.1rem]" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
