'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bot,
  DollarSign,
  Users,
  ChevronRight
} from 'lucide-react'

/**
 * 侧边栏导航项配置
 */
const navItems = [
  {
    title: '数据概览',
    href: '/',
    icon: LayoutDashboard,
    description: '统计卡片与图表'
  },
  {
    title: 'Bot 交互',
    href: '/bots',
    icon: Bot,
    description: 'Bot 详细数据'
  },
  {
    title: '收入分析',
    href: '/revenue',
    icon: DollarSign,
    description: '收入统计与趋势'
  },
  {
    title: '用户漏斗',
    href: '/funnel',
    icon: Users,
    description: '用户转化分析'
  }
]

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void
}

/**
 * 侧边栏组件
 * 提供页面导航功能，支持收起/展开
 */
export function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)

  const handleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* 收起/展开按钮 */}
      <button
        onClick={handleCollapse}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        <ChevronRight className={cn(
          'h-4 w-4 transition-transform',
          collapsed ? '' : 'rotate-180'
        )} />
      </button>

      {/* 导航列表 */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <div className="truncate">{item.title}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
