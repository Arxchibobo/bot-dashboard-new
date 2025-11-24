/**
 * 原始 Prompt:
 * 分析任务3: Basic vs Pro 订阅收入对比分析
 *
 * 目的:
 * 对比MyShell主站的Basic(PLAYER)和Pro(DEVELOPER)两类订阅的收入表现
 * 重点关注：
 * 1. 总体收入对比（月费/年费）
 * 2. 用户数量对比
 * 3. 月度趋势分析
 * 4. 年费转化率
 * 5. ARPU对比
 *
 * ========================================
 * 数据获取 - MCP Client 动态调用
 * ========================================
 *
 * 使用 MCP TypeScript SDK Client 连接到 mcphub_local 服务器
 * 动态调用 bytebase-execute_sql 工具执行 SQL 查询
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 MCP 配置
const MCP_CONFIG_PATH = path.join(__dirname, "mcp-config.json");
interface MCPConfig {
  type?: "stdio" | "http";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

let MCP_SERVER_CONFIG: MCPConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-everything"],
};

try {
  const configData = fs.readFileSync(MCP_CONFIG_PATH, "utf-8");
  const config = JSON.parse(configData);
  const serverConfig =
    config.mcpServers?.mcphub || config.mcpServers?.mcphub_local;
  if (serverConfig) {
    MCP_SERVER_CONFIG = serverConfig;
    console.log("✅ 已加载 MCP 配置文件\n");
    console.log(`   类型: ${serverConfig.type || "stdio"}`);
    if (serverConfig.url) {
      console.log(`   URL: ${serverConfig.url}\n`);
    } else {
      console.log(
        `   命令: ${serverConfig.command} ${serverConfig.args?.join(" ")}\n`,
      );
    }
  }
} catch (error) {
  console.warn("⚠️  未找到 mcp-config.json，使用默认配置\n");
}

interface SubscriptionData {
  subscription_level: string;
  plan_type: string;
  amount: number;
  total_orders: number;
  total_revenue: number;
  unique_users: number;
  first_order_date: string;
  last_order_date: string;
}

interface MonthlyTrendData {
  order_month: string;
  subscription_level: string;
  plan_type: string;
  total_orders: number;
  total_revenue: number;
  unique_users: number;
}

// SQL 查询语句
const SQL_QUERIES = {
  // 查询总体数据
  summary: `
    SELECT
        JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
        JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
        amount,
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(DATE(created_date)) as first_order_date,
        MAX(DATE(created_date)) as last_order_date
    FROM user_subscription_stripe_orders
    WHERE status = 'ORDER_STATUS_SUCCESS'
      AND biz_type = 'MEMBER'
    GROUP BY subscription_level, plan_type, amount
    ORDER BY subscription_level, plan_type;
  `,

  // 查询月度趋势
  monthly: `
    SELECT
        DATE_FORMAT(created_date, '%Y-%m') as order_month,
        JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
        JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users
    FROM user_subscription_stripe_orders
    WHERE status = 'ORDER_STATUS_SUCCESS'
      AND biz_type = 'MEMBER'
    GROUP BY order_month, subscription_level, plan_type
    ORDER BY order_month, subscription_level, plan_type;
  `,
};

/**
 * 创建 MCP Client 并连接到服务器
 */
async function createMCPClient(): Promise<Client> {
  const client = new Client({
    name: "basic-vs-pro-analysis-client",
    version: "1.0.0",
  });

  let transport;

  if (MCP_SERVER_CONFIG.type === "http" && MCP_SERVER_CONFIG.url) {
    // 使用 HTTP 传输
    console.log("🌐 使用 HTTP 传输连接到 MCP 服务器...\n");
    transport = new StreamableHTTPClientTransport(
      new URL(MCP_SERVER_CONFIG.url),
    );
  } else {
    // 使用 stdio 传输（默认）
    console.log("📡 使用 Stdio 传输连接到 MCP 服务器...\n");
    transport = new StdioClientTransport({
      command: MCP_SERVER_CONFIG.command!,
      args: MCP_SERVER_CONFIG.args!,
      env: MCP_SERVER_CONFIG.env || process.env,
    } as any);
  }

  await client.connect(transport);
  console.log("✅ 已连接到 MCP 服务器\n");

  return client;
}

/**
 * 通过 MCP Client 执行 SQL 查询
 */
async function executeSQL(client: Client, sql: string): Promise<any[]> {
  console.log("🔍 执行 SQL 查询...\n");

  const result = await client.callTool({
    name: "bytebase-execute_sql",
    arguments: { sql },
  });

  // 解析结果
  const content = result.content as any[];
  if (content && content.length > 0) {
    const textContent = content[0];

    if (textContent.type === "text") {
      try {
        const parsed = JSON.parse(textContent.text);

        // 检查是否有错误
        if (parsed.success === false) {
          console.error("   ❌ SQL 执行失败:", parsed.error);
          console.error("   错误代码:", parsed.code);
          return [];
        }

        // 成功的情况，返回数据
        if (parsed.success && parsed.data) {
          if (Array.isArray(parsed.data)) {
            console.log(`   ✅ 成功获取 ${parsed.data.length} 条记录`);
            return parsed.data;
          } else if (parsed.data.rows && Array.isArray(parsed.data.rows)) {
            console.log(`   ✅ 成功获取 ${parsed.data.rows.length} 条记录`);
            return parsed.data.rows;
          }
        }

        // 兼容直接返回数组的情况
        if (Array.isArray(parsed)) {
          console.log(`   ✅ 成功获取 ${parsed.length} 条记录`);
          return parsed;
        }

        console.warn("   ⚠️  未识别的返回格式");
        return [];
      } catch (e) {
        console.error("   ❌ 解析 SQL 结果失败:", e);
        console.error("   原始文本:", textContent.text?.substring(0, 500));
        return [];
      }
    }
  }

  console.warn("   ⚠️  未找到有效的返回内容");
  return [];
}

/**
 * 获取订阅数据
 */
async function fetchSubscriptionData(client: Client) {
  console.log("📊 开始获取订阅数据...\n");

  // 获取总体数据
  const summaryData = await executeSQL(client, SQL_QUERIES.summary);
  console.log(`✅ 获取到 ${summaryData.length} 条总体数据记录\n`);

  // 获取月度趋势数据
  const monthlyData = await executeSQL(client, SQL_QUERIES.monthly);
  console.log(`✅ 获取到 ${monthlyData.length} 条月度趋势记录\n`);

  return {
    summary: summaryData as SubscriptionData[],
    monthly: monthlyData as MonthlyTrendData[],
  };
}

/**
 * 处理数据并计算关键指标
 */
function processData(data: {
  summary: SubscriptionData[];
  monthly: MonthlyTrendData[];
}) {
  const { summary, monthly } = data;

  // 过滤掉 amount=0 的记录并分组数据
  const validSummary = summary.filter((d) => d.amount > 0);

  const basicMonthly = validSummary.find(
    (d) => d.subscription_level === "PLAYER" && d.plan_type === "MONTHLY",
  );
  const basicYearly = validSummary.find(
    (d) => d.subscription_level === "PLAYER" && d.plan_type === "YEARLY",
  );
  const proMonthly = validSummary.find(
    (d) => d.subscription_level === "DEVELOPER" && d.plan_type === "MONTHLY",
  );
  const proYearly = validSummary.find(
    (d) => d.subscription_level === "DEVELOPER" && d.plan_type === "YEARLY",
  );

  // Basic总计
  const basicTotalRevenue =
    (basicMonthly?.total_revenue || 0) + (basicYearly?.total_revenue || 0);
  const basicTotalUsers =
    (basicMonthly?.unique_users || 0) + (basicYearly?.unique_users || 0);
  const basicTotalOrders =
    (basicMonthly?.total_orders || 0) + (basicYearly?.total_orders || 0);

  // Pro总计
  const proTotalRevenue =
    (proMonthly?.total_revenue || 0) + (proYearly?.total_revenue || 0);
  const proTotalUsers =
    (proMonthly?.unique_users || 0) + (proYearly?.unique_users || 0);
  const proTotalOrders =
    (proMonthly?.total_orders || 0) + (proYearly?.total_orders || 0);

  // 总计
  const grandTotalRevenue = basicTotalRevenue + proTotalRevenue;
  const grandTotalUsers = basicTotalUsers + proTotalUsers;

  // ARPU
  const basicArpu = basicTotalRevenue / basicTotalUsers;
  const proArpu = proTotalRevenue / proTotalUsers;

  // 年费转化率
  const basicYearlyRate = (
    ((basicYearly?.unique_users || 0) / basicTotalUsers) *
    100
  ).toFixed(2);
  const proYearlyRate =
    proTotalUsers > 0
      ? (((proYearly?.unique_users || 0) / proTotalUsers) * 100).toFixed(2)
      : "0";

  // 收入占比
  const basicRevenueShare = (
    (basicTotalRevenue / grandTotalRevenue) *
    100
  ).toFixed(2);
  const proRevenueShare = ((proTotalRevenue / grandTotalRevenue) * 100).toFixed(
    2,
  );

  // 用户占比
  const basicUserShare = ((basicTotalUsers / grandTotalUsers) * 100).toFixed(2);
  const proUserShare = ((proTotalUsers / grandTotalUsers) * 100).toFixed(2);

  return {
    basic: {
      total_revenue: basicTotalRevenue.toFixed(2),
      total_users: basicTotalUsers,
      total_orders: basicTotalOrders,
      arpu: basicArpu.toFixed(2),
      yearly_rate: basicYearlyRate,
      revenue_share: basicRevenueShare,
      user_share: basicUserShare,
      monthly: basicMonthly,
      yearly: basicYearly,
    },
    pro: {
      total_revenue: proTotalRevenue.toFixed(2),
      total_users: proTotalUsers,
      total_orders: proTotalOrders,
      arpu: proArpu.toFixed(2),
      yearly_rate: proYearlyRate,
      revenue_share: proRevenueShare,
      user_share: proUserShare,
      monthly: proMonthly,
      yearly: proYearly,
    },
    grand_total: {
      revenue: grandTotalRevenue.toFixed(2),
      users: grandTotalUsers,
      orders: basicTotalOrders + proTotalOrders,
    },
    monthly: monthly,
  };
}

/**
 * 生成分析报告
 */
function generateReport(analysis: any, trends: any): string {
  let report = "";

  report += "# Basic vs Pro 订阅收入对比分析\n\n";
  report += `**分析时间**: 动态获取\n`;
  report += "**数据来源**: user_subscription_stripe_orders (biz_type=MEMBER)\n";
  report += "**获取方式**: MCP Client 动态调用\n\n";

  report += "---\n\n";

  // 1. 总体对比
  report += "## 一、总体收入对比\n\n";
  report += "### 整体表现\n\n";
  report += "| 指标 | Basic (PLAYER) | Pro (DEVELOPER) | 总计 |\n";
  report += "|------|----------------|-----------------|------|\n";
  report += `| 总收入 | $${analysis.basic.total_revenue} | $${analysis.pro.total_revenue} | $${analysis.grand_total.revenue} |\n`;
  report += `| 用户数 | ${analysis.basic.total_users} | ${analysis.pro.total_users} | ${analysis.grand_total.users} |\n`;
  report += `| 订单数 | ${analysis.basic.total_orders} | ${analysis.pro.total_orders} | ${analysis.grand_total.orders} |\n`;
  report += `| ARPU | $${analysis.basic.arpu} | $${analysis.pro.arpu} | - |\n`;
  report += `| 收入占比 | ${analysis.basic.revenue_share}% | ${analysis.pro.revenue_share}% | 100% |\n`;
  report += `| 用户占比 | ${analysis.basic.user_share}% | ${analysis.pro.user_share}% | 100% |\n\n`;

  // 2. 关键发现
  report += "### 关键发现\n\n";
  report += `✅ **Basic为绝对主力**: 贡献${analysis.basic.revenue_share}%收入，占${analysis.basic.user_share}%用户\n`;
  report += `✅ **Pro高价值但低量**: 仅${analysis.pro.user_share}%用户，但ARPU是Basic的${(analysis.pro.arpu / analysis.basic.arpu).toFixed(1)}倍\n`;
  report += `✅ **年费转化**: Basic年费转化率${analysis.basic.yearly_rate}%，Pro年费转化率${analysis.pro.yearly_rate}%\n\n`;

  report += "---\n\n";

  // 3. 月度趋势（如果有数据）
  if (Object.keys(trends).length > 0) {
    report += "## 二、月度趋势分析\n\n";
    report +=
      "| 月份 | Basic收入 | Basic用户 | Pro收入 | Pro用户 | 总收入 | Basic占比 |\n";
    report +=
      "|------|-----------|-----------|---------|---------|--------|----------|\n";

    Object.keys(trends)
      .sort()
      .forEach((month) => {
        const t = trends[month];
        const total = t.basic_revenue + t.pro_revenue;
        const basicShare =
          total > 0 ? ((t.basic_revenue / total) * 100).toFixed(1) : "0";
        report += `| ${month} | $${t.basic_revenue.toFixed(2)} | ${t.basic_users} | $${t.pro_revenue.toFixed(2)} | ${t.pro_users} | $${total.toFixed(2)} | ${basicShare}% |\n`;
      });
    report += "\n";
  }

  report += "---\n\n";

  // 4. 数据获取信息
  report += "## 数据获取信息\n\n";
  report += "**方式**: MCP TypeScript SDK Client\n";
  report += "**工具**: bytebase-execute_sql\n";
  report += "**传输**: Stdio Transport\n\n";

  return report;
}

/**
 * 分析月度趋势
 */
function analyzeMonthlyTrends(monthlyData: MonthlyTrendData[]) {
  const trends: Record<string, any> = {};

  monthlyData.forEach((item) => {
    const month = item.order_month;
    const level = item.subscription_level;

    if (!trends[month]) {
      trends[month] = {
        basic_revenue: 0,
        pro_revenue: 0,
        basic_users: 0,
        pro_users: 0,
      };
    }

    if (level === "PLAYER") {
      trends[month].basic_revenue += item.total_revenue;
      trends[month].basic_users += item.unique_users;
    } else if (level === "DEVELOPER") {
      trends[month].pro_revenue += item.total_revenue;
      trends[month].pro_users += item.unique_users;
    }
  });

  return trends;
}

/**
 * 主函数
 */
async function main() {
  let client: Client | null = null;

  try {
    console.log("🚀 开始 Basic vs Pro 订阅收入对比分析（MCP 动态版本）...\n");

    // 创建 MCP Client
    client = await createMCPClient();

    // 获取数据
    const data = await fetchSubscriptionData(client);

    // 处理数据
    const analysis = processData(data);
    const trends = analyzeMonthlyTrends(data.monthly);

    // 生成报告
    const report = generateReport(analysis, trends);

    // 输出到文件
    const outputDir = path.join(
      __dirname,
      "../runs/2025-11-14-basic-vs-pro-analysis-dynamic",
    );
    const outputPath = path.join(outputDir, "basic_vs_pro_revenue_analysis.md");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report);
    console.log(`✅ 分析报告已生成: ${outputPath}\n`);

    // 输出到控制台
    console.log(report);

    // 保存原始数据
    const rawDataPath = path.join(outputDir, "raw_data.json");
    fs.writeFileSync(
      rawDataPath,
      JSON.stringify({ summary: data.summary, monthly: data.monthly }, null, 2),
    );
    console.log(`✅ 原始数据已保存: ${rawDataPath}\n`);
  } catch (error) {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  } finally {
    // 关闭连接
    if (client) {
      await client.close();
      console.log("✅ MCP Client 已关闭\n");
    }
  }
}

// 运行
main().catch(console.error);
