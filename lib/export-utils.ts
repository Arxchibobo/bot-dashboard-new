import { BotInteraction } from './types'
import * as XLSX from 'xlsx'

/**
 * 导出为 CSV 格式
 * @param data 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 */
export function exportToCSV(data: BotInteraction[], filename: string = 'bot-data') {
  // 1. 准备表头和数据行
  const headers = ['Slug ID', '事件数', '独立用户数', '平均活跃度']
  const rows = data.map(bot => [
    bot.slug_id,
    bot.eventCount,
    bot.uniqueUsers,
    bot.avgActivity.toFixed(1)
  ])

  // 2. 组装 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // 3. 添加 BOM (支持中文字符)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 4. 触发下载
  downloadFile(blob, `${filename}_${getTimestamp()}.csv`)
}

/**
 * 导出为 Excel 格式
 * @param data 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 */
export function exportToExcel(data: BotInteraction[], filename: string = 'bot-data') {
  // 1. 准备数据 (表头 + 数据行)
  const worksheetData = [
    ['Slug ID', '事件数', '独立用户数', '平均活跃度'],
    ...data.map(bot => [
      bot.slug_id,
      bot.eventCount,
      bot.uniqueUsers,
      parseFloat(bot.avgActivity.toFixed(1))
    ])
  ]

  // 2. 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // 3. 设置列宽
  worksheet['!cols'] = [
    { wch: 30 }, // Slug ID
    { wch: 12 }, // 事件数
    { wch: 14 }, // 独立用户数
    { wch: 14 }  // 平均活跃度
  ]

  // 4. 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bot 数据')

  // 5. 导出文件
  XLSX.writeFile(workbook, `${filename}_${getTimestamp()}.xlsx`)
}

/**
 * 触发文件下载
 * @param blob 文件 Blob 对象
 * @param filename 文件名
 */
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 获取当前时间戳字符串
 * 格式: YYYYMMDD_HHMM
 * @returns 时间戳字符串
 */
function getTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}${month}${day}_${hour}${minute}`
}

/**
 * 计算导出数据的统计信息
 * @param data 数据数组
 * @returns 统计对象
 */
export function getExportStats(data: BotInteraction[]) {
  if (data.length === 0) {
    return {
      totalBots: 0,
      totalEvents: 0,
      totalUsers: 0,
      avgActivity: '0.0'
    }
  }

  return {
    totalBots: data.length,
    totalEvents: data.reduce((sum, bot) => sum + bot.eventCount, 0),
    totalUsers: data.reduce((sum, bot) => sum + bot.uniqueUsers, 0),
    avgActivity: (data.reduce((sum, bot) => sum + bot.avgActivity, 0) / data.length).toFixed(1)
  }
}
