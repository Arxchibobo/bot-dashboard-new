/**
 * Honeycomb API 客户端
 *
 * 功能：
 * 1. 调用 Honeycomb Query API 获取 bot 交互数据
 * 2. 转换数据格式为 DashboardData
 * 3. 处理错误和异常情况
 */

import { DashboardData } from './types'

// Honeycomb API 配置
const HONEYCOMB_API_BASE = 'https://api.honeycomb.io/1'

// 获取环境变量配置（运行时读取）
function getConfig() {
  return {
    apiKey: process.env.HONEYCOMB_API_KEY || '',
    team: process.env.HONEYCOMB_TEAM || 'shane',
    environment: process.env.HONEYCOMB_ENVIRONMENT || 'dev',
    dataset: process.env.HONEYCOMB_DATASET || 'myshell-art-web',
  }
}

// Honeycomb 查询响应类型
interface HoneycombQueryResponse {
  data: {
    results: Array<{
      slug_id?: string
      COUNT?: number
      'COUNT_DISTINCT(user_id)'?: number
    }>
  }
}

/**
 * 从 Honeycomb 获取 bot 交互数据
 * @returns DashboardData 格式的数据
 */
export async function fetchHoneycombData(): Promise<DashboardData> {
  // 获取配置并验证
  const config = getConfig()
  if (!config.apiKey) {
    throw new Error('未配置 HONEYCOMB_API_KEY。请在 .env.local 文件中设置。')
  }

  try {
    // 查询1：获取 Top 50 Bot（按事件数排序）
    const botsData = await queryHoneycomb({
      calculations: [
        { op: 'COUNT' },
        { op: 'COUNT_DISTINCT', column: 'user_id' }
      ],
      breakdowns: ['slug_id'],
      time_range: 259200, // 3天
      filters: [
        { column: 'slug_id', op: 'exists' }
      ],
      orders: [
        { op: 'COUNT', order: 'descending' }
      ],
      limit: 50
    })

    // 查询2：获取总计数据
    const totalsData = await queryHoneycomb({
      calculations: [
        { op: 'COUNT' },
        { op: 'COUNT_DISTINCT', column: 'user_id' }
      ],
      time_range: 259200, // 3天
      filters: [
        { column: 'slug_id', op: 'exists' }
      ]
    })

    // 转换数据格式
    const bots = botsData.data.results
      .filter(item => item.slug_id) // 过滤掉总计行
      .map(item => ({
        slug_id: item.slug_id!,
        eventCount: item.COUNT || 0,
        uniqueUsers: item['COUNT_DISTINCT(user_id)'] || 0,
        avgActivity: item.COUNT && item['COUNT_DISTINCT(user_id)']
          ? Math.round((item.COUNT / item['COUNT_DISTINCT(user_id)']) * 10) / 10
          : 0
      }))

    // 提取总计数据
    const totals = totalsData.data.results[0] || {}
    const totalEvents = totals.COUNT || 0
    const totalUsers = totals['COUNT_DISTINCT(user_id)'] || 0

    // 返回完整数据
    return {
      lastUpdate: new Date().toISOString(),
      totalEvents,
      totalUsers,
      bots
    }
  } catch (error) {
    console.error('Honeycomb API 调用失败:', error)
    throw new Error(`无法从 Honeycomb 获取数据: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 调用 Honeycomb Query API
 * @param querySpec 查询参数
 * @returns 查询响应
 */
async function queryHoneycomb(querySpec: any): Promise<HoneycombQueryResponse> {
  const config = getConfig()
  const url = `${HONEYCOMB_API_BASE}/queries/${config.dataset}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Honeycomb-Team': config.apiKey,
      'X-Honeycomb-Environment': config.environment,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...querySpec,
      disable_series: true, // 禁用时间序列，减少数据量
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Honeycomb API 请求失败 (${response.status}): ${errorText}`)
  }

  return await response.json()
}
