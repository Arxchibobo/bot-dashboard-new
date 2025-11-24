/**
 * 收入数据 MCP 客户端
 * 从 Bytebase 查询 user_subscription_stripe_orders 表
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { RevenueStats, DailyRevenue } from './types'

/**
 * MCP 工具调用结果类型定义
 */
interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
}

/**
 * 包装连接操作，添加超时控制
 */
async function connectWithTimeout(
  client: Client,
  transport: any,
  timeoutMs: number = 30000
): Promise<void> {
  return Promise.race([
    client.connect(transport),
    new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Connection timeout after ${timeoutMs / 1000} seconds`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * 包装 MCP 调用，添加超时控制
 */
async function callToolWithTimeout(
  client: Client,
  params: any,
  timeoutMs: number = 180000
) {
  return Promise.race([
    client.callTool(params),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timeout after ${timeoutMs / 1000} seconds`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * 清理 JSON_EXTRACT 返回的字符串（去除引号）
 */
function cleanJsonString(value: any): string {
  if (typeof value === 'string') {
    return value.replace(/^"|"$/g, '')
  }
  return String(value || '')
}

/**
 * 从 Bytebase 查询收入统计数据
 *
 * @param startTime - Unix 时间戳 (秒)
 * @param endTime - Unix 时间戳 (秒)
 * @returns RevenueStats 对象
 */
export async function fetchRevenueStats(
  startTime: number,
  endTime: number
): Promise<RevenueStats> {
  console.log('💰 开始查询收入统计数据...')
  console.log(`   时间范围: ${new Date(startTime * 1000).toISOString()} 至 ${new Date(endTime * 1000).toISOString()}`)

  // SQL 查询：按订阅类型、周期、业务类型、金额分组统计
  const sql = `
    SELECT
      JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
      JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
      biz_type,
      amount,
      COUNT(*) as order_count,
      SUM(amount) as total_revenue,
      COUNT(DISTINCT user_id) as unique_users
    FROM my_shell_prod.user_subscription_stripe_orders
    WHERE status = 'ORDER_STATUS_SUCCESS'
      AND created_date >= FROM_UNIXTIME(${startTime})
      AND created_date <= FROM_UNIXTIME(${endTime})
    GROUP BY subscription_level, plan_type, biz_type, amount
  `

  // 1. 创建 MCP 传输层
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  // 2. 创建 MCP 客户端
  const client = new Client(
    {
      name: "bot-dashboard-revenue-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  // 3. 连接到 MCP 服务器（30 秒超时）
  try {
    await connectWithTimeout(client, transport, 30000);
    console.log("   ✅ Connected to MCP server (revenue)");
  } catch (error) {
    console.error("   ❌ Failed to connect to MCP server:", error);
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // 4. 调用 Bytebase MCP 工具执行 SQL（3 分钟超时）
    const result = await callToolWithTimeout(
      client,
      {
        name: "bytebase-execute_sql",
        arguments: { sql }
      },
      180000 // 3 分钟超时
    ) as MCPToolResult;

    console.log('   ✅ SQL 查询成功')

    // 5. 解析结果
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
      throw new Error("Invalid MCP response format");
    }

    const responseText = content[0].text;
    const parsed = JSON.parse(responseText);

    // 检查是否有错误
    if (parsed.success === false) {
      console.error("   ❌ SQL 执行失败:", parsed.error);
      throw new Error(parsed.error || 'SQL execution failed');
    }

    // 提取数据行
    let rows: any[] = []
    if (parsed.success && parsed.data) {
      if (Array.isArray(parsed.data)) {
        rows = parsed.data;
      } else if (parsed.data.rows && Array.isArray(parsed.data.rows)) {
        rows = parsed.data.rows;
      }
    }

    console.log(`   📊 获取到 ${rows.length} 条记录`)

    // 聚合数据
    const stats = aggregateRevenueStats(rows)

    console.log('   💵 总收入:', stats.totalRevenue.toFixed(2), 'USD')
    console.log('   👥 付费用户:', stats.payingUsers)

    return stats
  } catch (error) {
    console.error('   ❌ 收入统计查询失败:', error)
    throw new Error(`收入统计查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    await client.close();
  }
}

/**
 * 从 Bytebase 查询每日收入趋势
 *
 * @param startTime - Unix 时间戳 (秒)
 * @param endTime - Unix 时间戳 (秒)
 * @returns DailyRevenue 数组
 */
export async function fetchDailyRevenue(
  startTime: number,
  endTime: number
): Promise<DailyRevenue[]> {
  console.log('📈 开始查询每日收入趋势...')

  // SQL 查询：按日期分组统计
  const sql = `
    SELECT
      DATE_FORMAT(created_date, '%Y-%m-%d') as payment_date,
      JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
      JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
      biz_type,
      amount,
      COUNT(*) as order_count,
      SUM(amount) as daily_revenue,
      COUNT(DISTINCT user_id) as daily_users
    FROM my_shell_prod.user_subscription_stripe_orders
    WHERE status = 'ORDER_STATUS_SUCCESS'
      AND created_date >= FROM_UNIXTIME(${startTime})
      AND created_date <= FROM_UNIXTIME(${endTime})
    GROUP BY payment_date, subscription_level, plan_type, biz_type, amount
    ORDER BY payment_date DESC
  `

  // 1. 创建 MCP 传输层
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  // 2. 创建 MCP 客户端
  const client = new Client(
    {
      name: "bot-dashboard-revenue-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  // 3. 连接到 MCP 服务器（30 秒超时）
  try {
    await connectWithTimeout(client, transport, 30000);
    console.log("   ✅ Connected to MCP server (daily revenue)");
  } catch (error) {
    console.error("   ❌ Failed to connect to MCP server:", error);
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // 4. 调用 Bytebase MCP 工具执行 SQL（3 分钟超时）
    const result = await callToolWithTimeout(
      client,
      {
        name: "bytebase-execute_sql",
        arguments: { sql }
      },
      180000 // 3 分钟超时
    ) as MCPToolResult;

    console.log('   ✅ SQL 查询成功')

    // 5. 解析结果
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
      throw new Error("Invalid MCP response format");
    }

    const responseText = content[0].text;
    const parsed = JSON.parse(responseText);

    // 检查是否有错误
    if (parsed.success === false) {
      console.error("   ❌ SQL 执行失败:", parsed.error);
      throw new Error(parsed.error || 'SQL execution failed');
    }

    // 提取数据行
    let rows: any[] = []
    if (parsed.success && parsed.data) {
      if (Array.isArray(parsed.data)) {
        rows = parsed.data;
      } else if (parsed.data.rows && Array.isArray(parsed.data.rows)) {
        rows = parsed.data.rows;
      }
    }

    console.log(`   📊 获取到 ${rows.length} 条每日记录`)

    // 聚合每日数据
    const dailyData = aggregateDailyRevenue(rows)

    console.log(`   📅 生成 ${dailyData.length} 天的收入趋势`)

    return dailyData
  } catch (error) {
    console.error('   ❌ 每日收入查询失败:', error)
    throw new Error(`每日收入查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    await client.close();
  }
}

/**
 * 聚合收入统计数据
 */
function aggregateRevenueStats(rows: any[]): RevenueStats {
  // 初始化统计数据
  let totalRevenue = 0
  const payingUsersSet = new Set<string>()

  let basicRevenue = 0
  let basicUsers = 0
  let proRevenue = 0
  let proUsers = 0

  let subscriptionRevenue = 0
  let energyRevenue = 0
  let articleRevenue = 0

  let basicMonthlyRevenue = 0
  let basicYearlyRevenue = 0
  let proMonthlyRevenue = 0
  let proYearlyRevenue = 0

  let energy500Revenue = 0
  let energy2000Revenue = 0

  // 遍历每一行数据
  rows.forEach(row => {
    const level = cleanJsonString(row.subscription_level)
    const planType = cleanJsonString(row.plan_type)
    const bizType = row.biz_type
    const amount = parseFloat(row.amount) || 0
    const revenue = parseFloat(row.total_revenue) || 0
    const users = parseInt(row.unique_users) || 0

    // 累计总收入
    totalRevenue += revenue

    // 订阅收入分类 (MEMBER)
    if (bizType === 'MEMBER') {
      subscriptionRevenue += revenue

      // Basic (PLAYER) 订阅
      if (level === 'PLAYER') {
        basicRevenue += revenue
        basicUsers += users

        if (planType === 'MONTHLY') {
          basicMonthlyRevenue += revenue
        } else if (planType === 'YEARLY') {
          basicYearlyRevenue += revenue
        }
      }
      // Pro (DEVELOPER) 订阅
      else if (level === 'DEVELOPER') {
        proRevenue += revenue
        proUsers += users

        if (planType === 'MONTHLY') {
          proMonthlyRevenue += revenue
        } else if (planType === 'YEARLY') {
          proYearlyRevenue += revenue
        }
      }
    }
    // 电量包收入 (ENERGY)
    else if (bizType === 'ENERGY') {
      energyRevenue += revenue

      // 500 电量包 ($6.99)
      if (Math.abs(amount - 6.99) < 0.01) {
        energy500Revenue += revenue
      }
      // 2000 电量包 ($20.99)
      else if (Math.abs(amount - 20.99) < 0.01) {
        energy2000Revenue += revenue
      }
    }
    // 文章收入 (ARTICLE)
    else if (bizType === 'ARTICLE') {
      articleRevenue += revenue
    }
  })

  // 计算付费用户数（假设所有行的 unique_users 都是不重复的）
  const payingUsers = rows.reduce((sum, row) => sum + (parseInt(row.unique_users) || 0), 0)

  // 计算 ARPU 和 ARPPU
  const arpu = payingUsers > 0 ? totalRevenue / payingUsers : 0
  const arppu = arpu // 这里付费用户 = 总用户

  return {
    totalRevenue,
    payingUsers,
    arpu,
    arppu,
    basicRevenue,
    basicUsers,
    proRevenue,
    proUsers,
    subscriptionRevenue,
    energyRevenue,
    articleRevenue,
    basicMonthlyRevenue,
    basicYearlyRevenue,
    proMonthlyRevenue,
    proYearlyRevenue,
    energy500Revenue,
    energy2000Revenue
  }
}

/**
 * 聚合每日收入数据
 */
function aggregateDailyRevenue(rows: any[]): DailyRevenue[] {
  // 按日期分组
  const dailyMap = new Map<string, {
    totalRevenue: number
    basicRevenue: number
    proRevenue: number
    energyRevenue: number
    articleRevenue: number
    payingUsersSet: Set<string>
    orderCount: number
  }>()

  rows.forEach(row => {
    const date = row.payment_date
    const level = cleanJsonString(row.subscription_level)
    const bizType = row.biz_type
    const revenue = parseFloat(row.daily_revenue) || 0
    const orderCount = parseInt(row.order_count) || 0

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        totalRevenue: 0,
        basicRevenue: 0,
        proRevenue: 0,
        energyRevenue: 0,
        articleRevenue: 0,
        payingUsersSet: new Set(),
        orderCount: 0
      })
    }

    const dayData = dailyMap.get(date)!
    dayData.totalRevenue += revenue
    dayData.orderCount += orderCount

    // 分类收入
    if (bizType === 'MEMBER') {
      if (level === 'PLAYER') {
        dayData.basicRevenue += revenue
      } else if (level === 'DEVELOPER') {
        dayData.proRevenue += revenue
      }
    } else if (bizType === 'ENERGY') {
      dayData.energyRevenue += revenue
    } else if (bizType === 'ARTICLE') {
      dayData.articleRevenue += revenue
    }
  })

  // 转换为数组
  const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    totalRevenue: data.totalRevenue,
    basicRevenue: data.basicRevenue,
    proRevenue: data.proRevenue,
    energyRevenue: data.energyRevenue,
    articleRevenue: data.articleRevenue,
    payingUsers: data.payingUsersSet.size,
    orderCount: data.orderCount
  }))

  // 按日期升序排序
  return dailyRevenue.sort((a, b) => a.date.localeCompare(b.date))
}
