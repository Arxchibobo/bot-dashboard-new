/**
 * Dashboard 数据 API 端点
 *
 * GET /api/data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 功能：从 Honeycomb 获取指定时间范围的数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchHoneycombData, fetchLoginStats, fetchUserFunnel } from '@/lib/honeycomb-mcp-client'
import { transformHoneycombData } from '@/lib/transform-honeycomb'

// 设置 API 路由超时时间为 5 分钟 (300 秒)
// 这允许 Honeycomb 查询有足够的时间完成大范围数据查询
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let startTime: number | undefined
    let endTime: number | undefined

    // 解析开始时间（UTC 时区）
    if (startDate) {
      const date = new Date(startDate + 'T00:00:00Z') // 明确使用 UTC
      if (!isNaN(date.getTime())) {
        startTime = Math.floor(date.getTime() / 1000)
      }
    }

    // 解析结束时间（UTC 时区）
    if (endDate) {
      const date = new Date(endDate + 'T23:59:59Z') // 明确使用 UTC，包含结束日期的整天
      if (!isNaN(date.getTime())) {
        endTime = Math.floor(date.getTime() / 1000)
      }
    }

    console.log('📊 API 收到数据请求:', { startDate, endDate, startTime, endTime })

    // 从 Honeycomb 获取数据（并行执行，独立错误处理）
    const results = await Promise.allSettled([
      fetchHoneycombData(startTime, endTime),
      startTime && endTime ? fetchLoginStats(startTime, endTime).catch(err => {
        console.error('⚠️ Login stats query failed:', err.message);
        return undefined;
      }) : Promise.resolve(undefined),
      startTime && endTime ? fetchUserFunnel(startTime, endTime).catch(err => {
        console.error('⚠️ User funnel query failed:', err.message);
        return undefined;
      }) : Promise.resolve(undefined)
    ])

    // 处理主数据查询结果
    let dashboardData: any;

    if (results[0].status === 'rejected') {
      const errorMessage = results[0].reason?.message || '未知错误';
      console.error('⚠️ Bot data query failed, returning partial data:', errorMessage);

      // 检查是否是超时错误
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');

      // 主查询失败，返回空的Bot数据，但保留其他统计信息
      dashboardData = {
        lastUpdate: new Date().toISOString(),
        totalEvents: 0,
        totalUsers: 0,
        bots: [],
        errorInfo: {
          type: isTimeout ? 'timeout' : 'error',
          message: errorMessage,
          suggestion: isTimeout
            ? '查询超时，请尝试缩小时间范围或稍后重试'
            : '查询失败，请检查网络连接或稍后重试'
        }
      };
    } else {
      // 主查询成功，转换数据格式
      const rawResults = results[0].value;
      dashboardData = transformHoneycombData(rawResults);
    }

    // 添加登录统计数据（如果成功）
    if (results[1].status === 'fulfilled' && results[1].value) {
      dashboardData.loginStats = results[1].value
    }

    // 添加用户行为漏斗数据（如果成功）
    if (results[2].status === 'fulfilled' && results[2].value) {
      dashboardData.userFunnel = results[2].value
    }

    console.log(`✅ API 返回数据: ${dashboardData.bots.length} 个 Bot`)

    // 检查是否因为时间范围过长而限制了Bot数量
    const timeRangeDays = startTime && endTime ? (endTime - startTime) / 86400 : 0
    const limitReduced = timeRangeDays > 7
    const botDataFailed = results[0].status === 'rejected'

    return NextResponse.json({
      success: true,
      data: dashboardData,
      limitReduced,
      botDataFailed, // 标记Bot数据是否加载失败
      partialData: botDataFailed, // 如果Bot数据失败，标记为部分数据
      query: {
        startDate: startDate || '2025-10-15',
        endDate: endDate || new Date().toISOString().split('T')[0],
        startTime,
        endTime
      }
    })
  } catch (error) {
    console.error('❌ API 数据获取失败:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        message: `数据获取失败: ${errorMessage}`,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}


