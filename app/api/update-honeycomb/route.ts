/**
 * Honeycomb 数据更新 API 端点
 *
 * POST /api/update-honeycomb
 * 功能：从 Honeycomb 获取最新数据并保存到本地文件
 */

import { NextResponse } from 'next/server'
import { fetchHoneycombData } from '@/lib/honeycomb-client'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    console.log('开始从 Honeycomb 获取数据...')

    // 1. 调用 Honeycomb API 获取数据
    const data = await fetchHoneycombData()

    console.log(`成功获取数据：${data.bots.length} 个 Bot，总事件数 ${data.totalEvents}`)

    // 2. 保存到 data/bot-interactions.json
    const filePath = path.join(process.cwd(), 'data', 'bot-interactions.json')
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')

    console.log('数据已保存到文件')

    // 3. 返回成功响应和数据
    return NextResponse.json({
      success: true,
      message: `数据更新成功！获取了 ${data.bots.length} 个 Bot 的数据。`,
      data,
      stats: {
        totalEvents: data.totalEvents,
        totalUsers: data.totalUsers,
        botCount: data.bots.length,
        lastUpdate: data.lastUpdate
      }
    })
  } catch (error) {
    console.error('更新失败:', error)

    // 4. 错误处理
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        message: `数据更新失败: ${errorMessage}`,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

// 支持 GET 请求（返回使用说明）
export async function GET() {
  return NextResponse.json({
    message: '此端点用于更新 Honeycomb 数据',
    usage: '请使用 POST 方法调用此端点',
    example: 'POST /api/update-honeycomb'
  })
}
