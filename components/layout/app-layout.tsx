'use client'

import * as React from 'react'
import { TopNav } from './top-nav'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * 应用布局组件
 * 包含顶部导航栏、侧边栏和主内容区域
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 顶部导航栏 */}
      <TopNav />

      {/* 侧边栏 */}
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      {/* 主内容区域 */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="container mx-auto px-6 py-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  )
}
