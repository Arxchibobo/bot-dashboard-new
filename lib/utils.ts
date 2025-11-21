// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名的工具函数
 * 使用 clsx 和 tailwind-merge 来智能合并类名
 *
 * @param inputs - 要合并的类名
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期时间为相对时间（例如：2分钟前）
 *
 * @param dateString - ISO 格式的日期字符串
 * @returns 格式化后的相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} 秒前`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} 分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} 小时前`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} 天前`
  }
}

/**
 * 格式化数字为千位分隔符格式（例如：1,234,567）
 *
 * @param num - 要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

/**
 * 计算平均活跃度（保留一位小数）
 *
 * @param eventCount - 事件总数
 * @param uniqueUsers - 独立用户数
 * @returns 平均活跃度
 */
export function calculateAvgActivity(eventCount: number, uniqueUsers: number): number {
  if (uniqueUsers === 0) return 0
  return Math.round((eventCount / uniqueUsers) * 10) / 10
}
