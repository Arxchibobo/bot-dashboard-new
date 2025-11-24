/**
 * ============================================================================
 * 日收入统计报告生成脚本
 * ============================================================================
 *
 * 原始 Prompt:
 * 参考 shence-01.sql 查询语句，从 Bytebase 获取支付数据，生成按天聚合的收入统计CSV
 *
 * 目的:
 * 从 Bytebase 业务数据库 my_shell_prod.user_subscription_stripe_orders 表查询实际支付数据，
 * 按天聚合并生成包含以下字段的CSV文件：
 * - time(天) - 支付日期
 * - 单日总收入(求和) - 该天所有支付类型的总收入
 * - 月度player pass(求和) - Player等级月度订阅收入
 * - 年度player pass(求和) - Player等级年度订阅收入
 * - 月度developer pass(求和) - Developer等级月度订阅收入
 * - 年度developer pass(求和) - Developer等级年度订阅收入
 * - energy_500(求和) - 500电量包收入
 * - energy_2000(求和) - 2000电量包收入
 * - article v3(求和) - 文章支付收入
 *
 * ============================================================================
 * 字段来源说明
 * ============================================================================
 *
 * 数据源: Bytebase my_shell_prod.user_subscription_stripe_orders
 * - 表结构: 用户订阅和支付订单表
 * - 关键字段:
 *   * created_date: 订单创建时间（用于按天聚合）
 *   * status: 订单状态（筛选条件: ORDER_STATUS_SUCCESS）
 *   * biz_type: 业务类型（MEMBER=订阅, ENERGY=电量包, ARTICLE=文章）
 *   * amount: 支付金额（单位: USD）
 *   * extra: JSON字段，包含订阅元数据
 *     - extra.metadata.level: 订阅等级（PLAYER/DEVELOPER）
 *     - extra.metadata.plan_type: 订阅周期（MONTHLY/YEARLY）
 *
 * CSV字段映射逻辑:
 *
 * 1. time(天) - DATE_FORMAT(created_date, '%Y-%m-%d')
 *    来源: created_date 字段（UTC存储），数据库session timezone为Asia/Shanghai
 *    DATE_FORMAT 自动按照数据库时区(Asia/Shanghai)转换后格式化为 YYYY-MM-DD
 *
 * 2. 单日总收入(求和) - SUM(amount * order_count)
 *    来源: 所有支付类型的总和
 *    计算: subscription_player_monthly + subscription_player_yearly +
 *          subscription_developer_monthly + subscription_developer_yearly +
 *          energy_500 + energy_2000 + article
 *
 * 3. 月度player pass(求和)
 *    来源: biz_type='MEMBER' AND level='PLAYER' AND plan_type='MONTHLY'
 *    单价: $6.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *
 * 4. 年度player pass(求和)
 *    来源: biz_type='MEMBER' AND level='PLAYER' AND plan_type='YEARLY'
 *    单价: $58.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *
 * 5. 月度developer pass(求和)
 *    来源: biz_type='MEMBER' AND level='DEVELOPER' AND plan_type='MONTHLY'
 *    单价: $59.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *
 * 6. 年度developer pass(求和)
 *    来源: biz_type='MEMBER' AND level='DEVELOPER' AND plan_type='YEARLY'
 *    单价: $499.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *
 * 7. energy_500(求和)
 *    来源: biz_type='ENERGY' AND amount=6.99
 *    单价: $6.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *    判断依据: 根据金额判断电量包类型（6.99 = 500电量）
 *
 * 8. energy_2000(求和)
 *    来源: biz_type='ENERGY' AND amount=20.99
 *    单价: $20.99
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *    判断依据: 根据金额判断电量包类型（20.99 = 2000电量）
 *
 * 9. article v3(求和)
 *    来源: biz_type='ARTICLE'
 *    单价: $5.99（2025-07-11至2025-07-27期间为$0.99）
 *    计算: SUM(amount * order_count) WHERE 条件匹配
 *
 * ============================================================================
 * SQL查询逻辑
 * ============================================================================
 *
 * SELECT
 *   DATE_FORMAT(created_date, '%Y-%m-%d') as payment_date,
 *   JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
 *   JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
 *   biz_type,
 *   amount,
 *   COUNT(*) as order_count
 * FROM my_shell_prod.user_subscription_stripe_orders
 * WHERE status = 'ORDER_STATUS_SUCCESS'
 *   AND created_date >= DATE_SUB(NOW(), INTERVAL 14 DAY)
 * GROUP BY payment_date, subscription_level, plan_type, biz_type, amount
 * ORDER BY payment_date DESC
 *
 * 查询条件:
 * - status = 'ORDER_STATUS_SUCCESS': 只统计支付成功的订单
 * - created_date >= DATE_SUB(NOW(), INTERVAL 14 DAY): 近14天数据
 * - created_date 字段: UTC时间存储，数据库session timezone为Asia/Shanghai
 * - DATE_FORMAT(created_date, '%Y-%m-%d'): 自动按Asia/Shanghai时区转换并格式化
 * - GROUP BY: 按日期、订阅等级、订阅类型、业务类型、金额分组
 *
 * 聚合逻辑:
 * 1. 先按照 payment_date + subscription_level + plan_type + biz_type + amount 分组统计订单数
 * 2. 在代码中根据 biz_type 和其他字段将收入分类到对应的CSV列
 * 3. 最后按 payment_date 聚合所有收入类型
 *
 * ============================================================================
 * 价格映射规则
 * ============================================================================
 *
 * 订阅套餐:
 * - subscription_player_monthly: $6.99
 * - subscription_player_yearly: $58.99
 * - subscription_developer_monthly: $59.99
 * - subscription_developer_yearly: $499.99
 *
 * 电量包:
 * - energy_500: $6.99
 * - energy_2000: $20.99
 *
 * 文章:
 * - article (2025-07-11 至 2025-07-27): $0.99
 * - article (其他时间): $5.99
 *
 * ============================================================================
 * 输出格式
 * ============================================================================
 *
 * CSV格式: Tab分隔 (\t)
 * 表头: 中文
 * 排序: 按日期倒序（最新日期在前）
 * 时间范围: 近14天
 * 时区: Asia/Shanghai (UTC+8 北京时间)
 *       数据库存储为UTC，session timezone为Asia/Shanghai，DATE_FORMAT自动转换
 * 小数位: 保留2位小数
 *
 * 输出文件:
 * - runs/2025-11-14-payment-analysis/daily_revenue_summary.csv - 主要CSV文件
 * - runs/2025-11-14-payment-analysis/bytebase_payment_raw.json - 原始JSON数据
 *
 * ============================================================================
 * 依赖和运行
 * ============================================================================
 *
 * 依赖:
 * - @modelcontextprotocol/sdk (MCP客户端)
 * - mcphub_local bytebase MCP server (需要启动)
 *
 * 运行方式:
 * node scripts/generate_daily_revenue_report.js
 *
 * 前置条件:
 * - MCP server运行在 http://127.0.0.1:3000/mcp
 * - 有权限访问 my_shell_prod.user_subscription_stripe_orders 表
 *
 * ============================================================================
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 价格映射（用于参考，实际使用数据库中的amount字段）
const PRICES = {
  subscription_player_monthly: 6.99,
  subscription_player_yearly: 58.99,
  subscription_developer_monthly: 59.99,
  subscription_developer_yearly: 499.99,
  energy_500: 6.99,
  energy_2000: 20.99,
  article: 5.99,
};

// SQL查询：从Bytebase获取支付数据（使用数据库时区 Asia/Shanghai，返回纯日期字符串）
// 注意：数据库 session timezone 为 Asia/Shanghai，created_date 存储为 UTC
// DATE_FORMAT 会自动按照 session timezone (Asia/Shanghai) 转换并格式化
const SQL_QUERY = `
SELECT
  DATE_FORMAT(created_date, '%Y-%m-%d') as payment_date,
  JSON_EXTRACT(extra, '$.metadata.level') as subscription_level,
  JSON_EXTRACT(extra, '$.metadata.plan_type') as plan_type,
  biz_type,
  amount,
  COUNT(*) as order_count
FROM my_shell_prod.user_subscription_stripe_orders
WHERE status = 'ORDER_STATUS_SUCCESS'
  AND created_date >= DATE_SUB(NOW(), INTERVAL 14 DAY)
GROUP BY payment_date, subscription_level, plan_type, biz_type, amount
ORDER BY payment_date DESC
`;

async function main() {
  // 创建MCP客户端
  console.log("mcp url", "http://52.12.230.109:3000/mcp");
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  const client = new Client(
    {
      name: "daily-revenue-report-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  try {
    console.log("📊 Querying payment data from Bytebase...\n");

    // 执行SQL查询
    const result = await client.callTool({
      name: "bytebase-execute_sql",
      arguments: { sql: SQL_QUERY },
    });

    // 解析结果
    const content = result.content;
    if (!content || content.length === 0 || content[0].type !== "text") {
      throw new Error("Invalid response format");
    }

    const parsed = JSON.parse(content[0].text);
    if (!parsed.success || !parsed.data || !parsed.data.rows) {
      throw new Error(`Query failed: ${parsed.error || "Unknown error"}`);
    }

    const rows = parsed.data.rows;
    console.log(`✅ Retrieved ${rows.length} payment records\n`);

    // 按天聚合收入
    const dailyRevenue: {
      [date: string]: {
        date: string,
        subscription_player_monthly: number,
        subscription_player_yearly: number,
        subscription_developer_monthly: number,
        subscription_developer_yearly: number,
        energy_500: number,
        energy_2000: number,
        article: number,
      },
    } = {};

    rows.forEach((row: any) => {
      const date = row.payment_date;
      const level = (row.subscription_level || "")
        .replace(/"/g, "")
        .toUpperCase();
      const planType = (row.plan_type || "").replace(/"/g, "").toUpperCase();
      const bizType = row.biz_type || "";
      const amount = parseFloat(row.amount) || 0;
      const count = parseInt(row.order_count) || 0;

      // 初始化日期记录
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = {
          date,
          subscription_player_monthly: 0,
          subscription_player_yearly: 0,
          subscription_developer_monthly: 0,
          subscription_developer_yearly: 0,
          energy_500: 0,
          energy_2000: 0,
          article: 0,
        };
      }

      const revenue = amount * count;

      // 订阅收入分类
      if (bizType === "MEMBER") {
        if (level === "PLAYER" && planType === "MONTHLY") {
          dailyRevenue[date].subscription_player_monthly += revenue;
        } else if (level === "PLAYER" && planType === "YEARLY") {
          dailyRevenue[date].subscription_player_yearly += revenue;
        } else if (level === "DEVELOPER" && planType === "MONTHLY") {
          dailyRevenue[date].subscription_developer_monthly += revenue;
        } else if (level === "DEVELOPER" && planType === "YEARLY") {
          dailyRevenue[date].subscription_developer_yearly += revenue;
        }
      }
      // 电量包收入分类（根据金额判断）
      else if (bizType === "ENERGY") {
        if (Math.abs(amount - 6.99) < 0.01) {
          dailyRevenue[date].energy_500 += revenue;
        } else if (Math.abs(amount - 20.99) < 0.01) {
          dailyRevenue[date].energy_2000 += revenue;
        }
      }
      // 文章收入
      else if (bizType === "ARTICLE") {
        dailyRevenue[date].article += revenue;
      }
    });

    // 转换为数组并排序（倒序：最新日期在前）
    const sortedDates = Object.keys(dailyRevenue).sort().reverse();
    const dailyData = sortedDates.map((date) => {
      const data = dailyRevenue[date];
      const totalRevenue =
        data.subscription_player_monthly +
        data.subscription_player_yearly +
        data.subscription_developer_monthly +
        data.subscription_developer_yearly +
        data.energy_500 +
        data.energy_2000 +
        data.article;

      return {
        date,
        total_revenue: totalRevenue.toFixed(2),
        monthly_player_pass: data.subscription_player_monthly.toFixed(2),
        yearly_player_pass: data.subscription_player_yearly.toFixed(2),
        monthly_developer_pass: data.subscription_developer_monthly.toFixed(2),
        yearly_developer_pass: data.subscription_developer_yearly.toFixed(2),
        energy_500: data.energy_500.toFixed(2),
        energy_2000: data.energy_2000.toFixed(2),
        article_v3: data.article.toFixed(2),
      };
    });

    // 生成CSV（使用制表符分隔，中文表头）
    const csvHeader =
      "time(天)\t单日总收入(求和)\t月度player pass(求和)\t年度player pass(求和)\t月度developer pass(求和)\t年度developer pass(求和)\tenergy_500(求和)\tenergy_2000(求和)\tarticle v3(求和)\n";
    const csvRows = dailyData
      .map(
        (row) =>
          `${row.date}\t${row.total_revenue}\t${row.monthly_player_pass}\t${row.yearly_player_pass}\t${row.monthly_developer_pass}\t${row.yearly_developer_pass}\t${row.energy_500}\t${row.energy_2000}\t${row.article_v3}`
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // 保存文件
    const outputDir = path.join(
      process.cwd(),
      "runs",
      "2025-11-14-payment-analysis"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, "daily_revenue_summary.csv"),
      csvContent
    );

    // 保存原始JSON数据
    fs.writeFileSync(
      path.join(outputDir, "bytebase_payment_raw.json"),
      JSON.stringify(rows, null, 2)
    );

    console.log(
      `✅ Daily revenue summary saved to: ${outputDir}/daily_revenue_summary.csv`
    );
    console.log(`✅ Total days with data: ${dailyData.length}`);
    console.log(`\n📈 Preview (first 14 days - newest to oldest):`);
    console.log(csvHeader + csvRows.split("\n").slice(0, 14).join("\n"));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
