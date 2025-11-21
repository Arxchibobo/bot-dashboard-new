import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { LoginStats, UserFunnel, FunnelStep } from "./types";

// 默认开始时间：2025-10-15 00:00:00 UTC
const DEFAULT_START_TIME = 1760486400;

/**
 * 通过 MCP 从 Honeycomb 获取 bot 交互数据
 * @param startTime - 查询开始时间（epoch 秒），默认为 2025-10-15
 * @param endTime - 查询结束时间（epoch 秒），默认为当前时间
 * @returns Honeycomb 查询结果的 results 数组
 */
export async function fetchHoneycombData(
  startTime: number = DEFAULT_START_TIME,
  endTime: number = Math.floor(Date.now() / 1000)
) {
  // 根据时间范围自适应调整查询参数，避免超时
  const timeRangeDays = (endTime - startTime) / 86400; // 转换为天数
  let queryLimit = 100;
  let includeUniqueUsers = true; // 是否包含 COUNT_DISTINCT(user_id)

  // 所有查询都跳过 COUNT_DISTINCT 以避免超时（性能优化）
  includeUniqueUsers = false;

  // 根据时间范围调整Bot数量限制（为避免超时，大幅降低limit）
  if (timeRangeDays > 20) {
    queryLimit = 30; // 超过20天：最多30个Bot
    console.log(`⚡ Time range: ${timeRangeDays.toFixed(1)} days - limit 30 bots, no user count`);
  } else if (timeRangeDays > 10) {
    queryLimit = 40; // 10-20天：最多40个Bot
    console.log(`⚡ Time range: ${timeRangeDays.toFixed(1)} days - limit 40 bots, no user count`);
  } else if (timeRangeDays > 7) {
    queryLimit = 50; // 7-10天：最多50个Bot
    console.log(`📊 Time range: ${timeRangeDays.toFixed(1)} days - limit 50 bots, no user count`);
  } else {
    queryLimit = 80; // 7天以内：最多80个Bot
    console.log(`📊 Time range: ${timeRangeDays.toFixed(1)} days - limit 80 bots, no user count`);
  }

  // 构建计算列表
  const calculations: any[] = [{ op: "COUNT" }];
  if (includeUniqueUsers) {
    calculations.push({ op: "COUNT_DISTINCT", column: "user_id" });
  }

  // Honeycomb 查询配置（参考 docs/HONEYCOMB_INTEGRATION.md）
  // 优化查询：减少数据量
  const HONEYCOMB_QUERY_SPEC = {
    environment_slug: "dev",
    dataset_slug: "myshell-art-web",
    query_spec: {
      calculations,
      breakdowns: ["slug_id"],
      start_time: startTime,
      end_time: endTime,
      filters: [
        { column: "slug_id", op: "exists" }
      ],
      orders: [
        { op: "COUNT", order: "descending" }
      ],
      limit: queryLimit
    },
    output_format: "json",
    disable_total_by_aggregate: false,  // 重要：包含总计行
    enable_series: false  // 🔥 关闭时间序列，加快查询
  };
  // 1. 创建 MCP 传输层
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  // 2. 创建 MCP 客户端
  const client = new Client(
    {
      name: "bot-dashboard-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP server");

  try {
    // 3. 调用 Honeycomb MCP 工具
    const startDate = new Date(startTime * 1000).toISOString();
    const endDate = new Date(endTime * 1000).toISOString();
    console.log(`📊 Querying Honeycomb data from ${startDate} to ${endDate}...`);
    const result = await client.callTool({
      name: "honeycomb-run_query",  // MCP 工具名称
      arguments: HONEYCOMB_QUERY_SPEC
    });

    // 4. 解析结果
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
      throw new Error("Invalid MCP response format");
    }

    const parsed = JSON.parse(content[0].text);

    if (!parsed.success) {
      throw new Error(`Honeycomb query failed: ${parsed.error || "Unknown error"}`);
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      throw new Error("Invalid data format: missing results array");
    }

    console.log(`✅ Retrieved ${parsed.results.length} records from Honeycomb`);

    // 打印 Honeycomb 查询链接（如果有）
    if (parsed.query_url) {
      console.log(`🔗 Honeycomb Query URL: ${parsed.query_url}`);
    }
    if (parsed.query_pk) {
      console.log(`🔑 Query ID: ${parsed.query_pk}`);
    }

    return parsed.results;

  } finally {
    await client.close();
  }
}

/**
 * 通过 MCP 从 Honeycomb 获取登录用户统计
 * @param startTime - 查询开始时间（epoch 秒）
 * @param endTime - 查询结束时间（epoch 秒）
 * @returns 登录用户统计数据
 */
export async function fetchLoginStats(
  startTime: number,
  endTime: number
): Promise<LoginStats> {
  // 1. 创建 MCP 传输层
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  // 2. 创建 MCP 客户端
  const client = new Client(
    {
      name: "bot-dashboard-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);

  try {
    // 查询1: 当前时间范围内的登录数据
    console.log(`📊 Querying login stats for current period...`);
    const currentPeriodResult = await client.callTool({
      name: "honeycomb-run_query",
      arguments: {
        environment_slug: "dev",
        dataset_slug: "myshell-art-web",
        query_spec: {
          calculations: [
            { op: "COUNT" },
            { op: "COUNT_DISTINCT", column: "user_id" }
          ],
          start_time: startTime,
          end_time: endTime,
          filters: [
            { column: "name", op: "=", value: "auth_success_art" },
            { column: "user_id", op: "exists" }
          ]
        },
        output_format: "json",
        enable_series: false
      }
    });

    // 查询2: 时间范围之前的登录用户（用于判断老用户）
    console.log(`📊 Querying historical users before ${new Date(startTime * 1000).toISOString()}...`);
    const historicalResult = await client.callTool({
      name: "honeycomb-run_query",
      arguments: {
        environment_slug: "dev",
        dataset_slug: "myshell-art-web",
        query_spec: {
          calculations: [
            { op: "COUNT_DISTINCT", column: "user_id" }
          ],
          start_time: 1727020800, // 从最早的数据开始（2025-09-22）
          end_time: startTime - 1, // 到当前时间范围之前
          filters: [
            { column: "name", op: "=", value: "auth_success_art" },
            { column: "user_id", op: "exists" }
          ]
        },
        output_format: "json",
        enable_series: false
      }
    });

    // 解析当前时间范围的结果
    const currentContent = currentPeriodResult.content;
    if (!Array.isArray(currentContent) || currentContent.length === 0 || currentContent[0].type !== "text") {
      throw new Error("Invalid MCP response format for current period");
    }
    const currentParsed = JSON.parse(currentContent[0].text);
    if (!currentParsed.success || !currentParsed.results || currentParsed.results.length === 0) {
      throw new Error("No login data found for current period");
    }

    const totalLogins = currentParsed.results[0].COUNT || 0;
    const uniqueLoginUsers = currentParsed.results[0]["COUNT_DISTINCT(user_id)"] || 0;

    // 解析历史数据的结果
    const historicalContent = historicalResult.content;
    if (!Array.isArray(historicalContent) || historicalContent.length === 0 || historicalContent[0].type !== "text") {
      throw new Error("Invalid MCP response format for historical data");
    }
    const historicalParsed = JSON.parse(historicalContent[0].text);
    const historicalUsers = (historicalParsed.success && historicalParsed.results && historicalParsed.results.length > 0)
      ? (historicalParsed.results[0]["COUNT_DISTINCT(user_id)"] || 0)
      : 0;

    // 计算新老用户
    // 注意：这是一个近似值，因为我们无法直接区分具体的用户ID
    // 假设：如果历史用户数为0，则所有用户都是新用户
    // 否则，老用户数量 = min(uniqueLoginUsers, historicalUsers)
    const returningUsers = Math.min(uniqueLoginUsers, historicalUsers);
    const newUsers = uniqueLoginUsers - returningUsers;

    console.log(`✅ Login stats: ${totalLogins} logins, ${uniqueLoginUsers} unique users (${newUsers} new, ${returningUsers} returning)`);

    return {
      totalLogins,
      uniqueLoginUsers,
      newUsers,
      returningUsers
    };

  } finally {
    await client.close();
  }
}

/**
 * 通过 MCP 从 Honeycomb 获取用户行为漏斗数据
 * 漏斗步骤：认证 -> 上传 -> 生成 -> 下载 -> 分享
 * 统计口径：同一用户在同一天内的行为
 *
 * @param startTime - 查询开始时间（epoch 秒）
 * @param endTime - 查询结束时间（epoch 秒）
 * @returns 用户行为漏斗数据
 */
export async function fetchUserFunnel(
  startTime: number,
  endTime: number
): Promise<UserFunnel> {
  // 漏斗步骤定义
  const funnelSteps = [
    { name: '认证成功', eventType: 'auth_success_art' },
    { name: '开始上传', eventType: 'image_upload_start_art' },
    { name: '开始生成', eventType: 'generation_start_art' },
    { name: '点击下载', eventType: 'download_click_art' },
    { name: '点击分享', eventType: 'share_click_art' }
  ];

  // 1. 创建 MCP 传输层
  const transport = new StreamableHTTPClientTransport(
    new URL("http://52.12.230.109:3000/mcp")
  );

  // 2. 创建 MCP 客户端
  const client = new Client(
    {
      name: "bot-dashboard-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);

  try {
    console.log(`📊 Querying user funnel data...`);

    // 为每个步骤查询数据
    // 简化版本：直接使用 COUNT 作为近似值，不按天分组（避免查询超时）
    const stepResults = await Promise.all(
      funnelSteps.map(async (step) => {
        try {
          const result = await client.callTool({
            name: "honeycomb-run_query",
            arguments: {
              environment_slug: "dev",
              dataset_slug: "myshell-art-web",
              query_spec: {
                calculations: [
                  { op: "COUNT" } // 事件总数作为 user-day 近似值
                ],
                start_time: startTime,
                end_time: endTime,
                filters: [
                  { column: "name", op: "=", value: step.eventType },
                  { column: "user_id", op: "exists" }
                ]
              },
              output_format: "json",
              enable_series: false // 不需要时间序列，加快查询
            }
          });

          // 解析结果
          const content = result.content;
          if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
            throw new Error(`Invalid MCP response format for ${step.eventType}`);
          }
          const parsed = JSON.parse(content[0].text);

          if (!parsed.success || !parsed.results || parsed.results.length === 0) {
            console.warn(`No data found for ${step.eventType}`);
            return { ...step, userDayCount: 0 };
          }

          // 使用 COUNT 作为 user-day 的近似值
          const totalUserDays = parsed.results[0]?.COUNT || 0;

          console.log(`  ${step.name} (${step.eventType}): ${totalUserDays} user-days`);

          return {
            ...step,
            userDayCount: totalUserDays
          };
        } catch (error) {
          console.error(`Error querying ${step.eventType}:`, error);
          return { ...step, userDayCount: 0 };
        }
      })
    );

    // 3. 计算转化率
    const steps: FunnelStep[] = stepResults.map((step, index) => {
      const prevCount = index === 0 ? step.userDayCount : stepResults[index - 1].userDayCount;
      const conversionRate = prevCount > 0
        ? Math.round((step.userDayCount / prevCount) * 10000) / 100
        : 0;

      const firstCount = stepResults[0].userDayCount;
      const overallConversionRate = firstCount > 0
        ? Math.round((step.userDayCount / firstCount) * 10000) / 100
        : 0;

      return {
        name: step.name,
        eventType: step.eventType,
        userDayCount: step.userDayCount,
        conversionRate: index === 0 ? 100 : conversionRate,
        overallConversionRate: index === 0 ? 100 : overallConversionRate
      };
    });

    console.log(`✅ Funnel calculated: ${steps.map(s => `${s.name}=${s.userDayCount}`).join(' -> ')}`);

    return {
      steps,
      startTime: new Date(startTime * 1000).toISOString(),
      endTime: new Date(endTime * 1000).toISOString(),
      totalUserDays: stepResults[0]?.userDayCount || 0
    };

  } finally {
    await client.close();
  }
}
