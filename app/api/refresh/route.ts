// app/api/refresh/route.ts
import { NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

/**
 * POST /api/refresh
 * 触发页面刷新（现在页面直接从 Honeycomb 查询，不需要单独的 API）
 *
 * 注意：此端点现在只用于触发前端 router.refresh()
 * 实际的数据查询在页面加载时自动进行
 */
export async function POST() {
  // 直接返回成功，让前端调用 router.refresh() 重新加载页面
  const response: ApiResponse = {
    success: true,
    message: '页面将重新加载最新数据'
  }

  return NextResponse.json(response)
}

/**
 * GET /api/refresh
 * 返回 API 使用说明
 */
export async function GET() {
  return NextResponse.json({
    message: '使用 POST 方法调用此端点以刷新页面',
    note: '页面会实时从 Honeycomb 查询最新数据'
  })
}
