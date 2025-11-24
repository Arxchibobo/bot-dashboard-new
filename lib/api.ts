import { DashboardData } from './types'

/**
 * 获取仪表板数据
 * 支持时间范围查询
 *
 * 在服务器端直接读取文件系统，在客户端使用 API 请求
 */
export async function getDashboardData(
  startDate?: string,
  endDate?: string
): Promise<DashboardData> {
  try {
    // 服务器端：直接读取文件（更简单、更快）
    // 时间筛选功能由客户端通过 API 实现
    if (typeof window === 'undefined') {
      const fs = await import('fs/promises')
      const path = await import('path')

      const dataPath = path.join(process.cwd(), 'data', 'bot-interactions.json')
      const fileContent = await fs.readFile(dataPath, 'utf-8')
      const data = JSON.parse(fileContent) as DashboardData

      return data
    }

    // 客户端使用 fetch API
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `/api/data${params.toString() ? `?${params}` : ''}`

    const response = await fetch(url, {
      cache: 'no-store' // 确保获取最新数据
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('获取仪表板数据失败:', error)
    throw error
  }
}
