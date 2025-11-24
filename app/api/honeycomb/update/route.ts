// app/api/honeycomb/update/route.ts
import { NextResponse } from 'next/server';
import { fetchHoneycombData } from '@/lib/honeycomb-mcp-client';
import { transformHoneycombData } from '@/lib/transform-honeycomb';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/honeycomb/update
 * Fetch latest data from Honeycomb via MCP and save to honeycomb-raw.json
 */
export async function POST() {
  try {
    console.log('🔄 Fetching data from Honeycomb via MCP...');

    // 默认查询最近 7 天的数据
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (7 * 24 * 60 * 60); // 7 天前

    // 使用新的 MCP 客户端查询 Honeycomb
    const rawResults = await fetchHoneycombData(startTime, endTime);

    console.log(`✅ Retrieved ${rawResults.length} records from Honeycomb`);

    // 转换数据格式（直接传递数组）
    const dashboardData = transformHoneycombData(rawResults);

    // 保存到 data/bot-interactions.json
    const dataDir = path.join(process.cwd(), 'data');
    const dataPath = path.join(dataDir, 'bot-interactions.json');

    await fs.writeFile(
      dataPath,
      JSON.stringify(dashboardData, null, 2),
      'utf-8'
    );

    console.log('✅ Data saved to data/bot-interactions.json');

    return NextResponse.json({
      success: true,
      message: 'Data updated successfully from Honeycomb',
      timestamp: new Date().toISOString(),
      stats: {
        totalEvents: dashboardData.totalEvents,
        totalUsers: dashboardData.totalUsers,
        botCount: dashboardData.bots.length
      }
    });

  } catch (error) {
    console.error('❌ Error updating from Honeycomb:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/honeycomb/update
 * Returns API usage information
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to update data from Honeycomb',
    endpoint: '/api/honeycomb/update',
    method: 'POST',
    description: 'Fetches latest bot interaction data from Honeycomb via MCP server'
  });
}
