import { BotInteraction } from './types'

/**
 * 筛选条件范围接口
 */
export interface FilterRanges {
  eventCount: [number, number]
  uniqueUsers: [number, number]
  avgActivity: [number, number]
}

/**
 * 预设筛选器类型
 */
export type PresetFilter = 'hot' | 'high-activity' | 'emerging' | 'popular' | 'all'

/**
 * 应用筛选条件到数据集
 * @param data 原始数据数组
 * @param ranges 筛选范围条件
 * @returns 筛选后的数据数组
 */
export function applyFilter(
  data: BotInteraction[],
  ranges: FilterRanges
): BotInteraction[] {
  return data.filter(bot => {
    // eventCount 必须存在
    const eventMatch = bot.eventCount >= ranges.eventCount[0] &&
                      bot.eventCount <= ranges.eventCount[1]

    // uniqueUsers 和 avgActivity 可能为 undefined，undefined 时跳过该条件
    const usersMatch = bot.uniqueUsers === undefined ||
                      (bot.uniqueUsers >= ranges.uniqueUsers[0] &&
                       bot.uniqueUsers <= ranges.uniqueUsers[1])

    const activityMatch = bot.avgActivity === undefined ||
                         (bot.avgActivity >= ranges.avgActivity[0] &&
                          bot.avgActivity <= ranges.avgActivity[1])

    return eventMatch && usersMatch && activityMatch
  })
}

/**
 * 获取数据的实际范围 (用于初始化滑块的最小最大值)
 * @param data 数据数组
 * @returns 数据的实际范围
 */
export function getDataRanges(data: BotInteraction[]): FilterRanges {
  if (data.length === 0) {
    return {
      eventCount: [0, 1000],
      uniqueUsers: [0, 500],
      avgActivity: [0, 10]
    }
  }

  // 过滤出有值的数据
  const validUsers = data.map(d => d.uniqueUsers).filter((v): v is number => v !== undefined)
  const validActivity = data.map(d => d.avgActivity).filter((v): v is number => v !== undefined)

  return {
    eventCount: [
      Math.min(...data.map(d => d.eventCount)),
      Math.max(...data.map(d => d.eventCount))
    ],
    uniqueUsers: validUsers.length > 0
      ? [Math.min(...validUsers), Math.max(...validUsers)]
      : [0, 500], // 默认范围
    avgActivity: validActivity.length > 0
      ? [Math.min(...validActivity), Math.max(...validActivity)]
      : [0, 10] // 默认范围
  }
}

/**
 * 获取预设筛选条件
 * @param preset 预设类型
 * @param dataRanges 数据范围
 * @returns 对应的筛选范围
 */
export function getPresetFilter(
  preset: PresetFilter,
  dataRanges: FilterRanges
): FilterRanges {
  switch (preset) {
    case 'hot':
      // 热门 Bot: 事件数 > 1000
      return { ...dataRanges, eventCount: [1000, dataRanges.eventCount[1]] }
    case 'high-activity':
      // 高活跃 Bot: 活跃度 > 8
      return { ...dataRanges, avgActivity: [8, dataRanges.avgActivity[1]] }
    case 'emerging':
      // 新兴潜力 Bot: 用户数 < 100 且活跃度 > 7
      return {
        ...dataRanges,
        uniqueUsers: [dataRanges.uniqueUsers[0], 100],
        avgActivity: [7, dataRanges.avgActivity[1]]
      }
    case 'popular':
      // 大众化 Bot: 用户数 > 500
      return { ...dataRanges, uniqueUsers: [500, dataRanges.uniqueUsers[1]] }
    case 'all':
      // 全部 Bot: 返回完整范围
      return dataRanges
    default:
      return dataRanges
  }
}

/**
 * 计算筛选结果统计
 * @param data 筛选后的数据
 * @returns 统计信息
 */
export function getFilterStats(data: BotInteraction[]) {
  if (data.length === 0) {
    return {
      count: 0,
      totalEvents: 0,
      totalUsers: 0,
      avgActivity: 0
    }
  }

  const validUsers = data.filter(bot => bot.uniqueUsers !== undefined)
  const validActivity = data.filter(bot => bot.avgActivity !== undefined)

  return {
    count: data.length,
    totalEvents: data.reduce((sum, bot) => sum + bot.eventCount, 0),
    totalUsers: validUsers.reduce((sum, bot) => sum + (bot.uniqueUsers || 0), 0),
    avgActivity: validActivity.length > 0
      ? validActivity.reduce((sum, bot) => sum + (bot.avgActivity || 0), 0) / validActivity.length
      : 0
  }
}
