import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { LoginStats, UserFunnel, FunnelStep } from "./types";

// 默认开始时间：2025-10-15 00:00:00 UTC
// 注意：这只是后备值,实际使用中前端会传递最近7天的具体日期
const DEFAULT_START_TIME = 1760486400;

/**
 * 解析 ASCII 表格格式的 Honeycomb 响应
 * 将 Markdown 表格转换为 JSON 结构
 *
 * @param asciiText - ASCII 格式的响应文本
 * @returns 包含 results 数组和元数据的对象
 */
function parseAsciiResponse(asciiText: string): {
  results: Array<{ [key: string]: any }>;
  query_url?: string;
  query_pk?: string;
} {
  const lines = asciiText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const results: Array<{ [key: string]: any }> = [];
  let headers: string[] = [];
  let inResultsSection = false;
  let query_url: string | undefined;
  let query_pk: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测 Results 部分开始
    if (line === '# Results') {
      inResultsSection = true;
      continue;
    }

    // 检测其他部分开始(结束 Results 部分)
    if (line.startsWith('#') && line !== '# Results') {
      inResultsSection = false;
      continue;
    }

    // 提取元数据
    if (line.includes('query_url:')) {
      const match = line.match(/query_url:\s*"([^"]+)"/);
      if (match) query_url = match[1];
      continue;
    }

    if (line.includes('query_run_pk:')) {
      const match = line.match(/query_run_pk:\s*(\S+)/);
      if (match) query_pk = match[1];
      continue;
    }

    // 处理 Results 表格
    if (inResultsSection && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

      // 跳过分隔符行 (包含 --- 的行)
      if (cells.length > 0 && cells[0].includes('---')) {
        continue;
      }

      // 第一行是表头
      if (headers.length === 0) {
        headers = cells;
        continue;
      }

      // 数据行
      if (cells.length > 0) {
        const row: { [key: string]: any } = {};

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = cells[j];

          // 尝试转换为数字
          if (value && !isNaN(Number(value))) {
            row[header] = Number(value);
          } else {
            row[header] = value || null;
          }
        }

        results.push(row);
      }
    }
  }

  return {
    results,
    query_url,
    query_pk
  };
}

/**
 * 包装 MCP 调用，添加超时控制
 * @param client - MCP 客户端实例
 * @param params - 调用参数
 * @param timeoutMs - 超时时间（毫秒），默认 180 秒
 * @returns Promise
 */
async function callToolWithTimeout(
  client: Client,
  params: any,
  timeoutMs: number = 180000 // 默认 3 分钟
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
 * MCP 工具调用结果类型定义
 */
interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
}

/**
 * 包装连接操作，添加超时控制
 * @param client - MCP 客户端实例
 * @param transport - 传输层
 * @param timeoutMs - 超时时间（毫秒），默认 30 秒
 * @returns Promise<void>
 */
async function connectWithTimeout(
  client: Client,
  transport: any,
  timeoutMs: number = 30000 // 默认 30 秒
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
 * 合并分批查询的结果
 * @param batchResults - 多个批次的查询结果数组
 * @returns 合并后的结果数组
 */
function mergeBatchResults(batchResults: any[][]): any[] {
  // 1. 收集所有 Bot 数据（排除总计行）
  const botMap = new Map<string, {
    COUNT: number;
    'COUNT_DISTINCT(user_id)'?: number;
  }>();

  for (const results of batchResults) {
    for (const item of results) {
      // 跳过总计行（没有 slug_id）
      if (!item.slug_id) continue;

      const slugId = item.slug_id;
      const count = item.COUNT || 0;
      const uniqueUsers = item['COUNT_DISTINCT(user_id)'];

      if (botMap.has(slugId)) {
        // 累加事件数
        const existing = botMap.get(slugId)!;
        existing.COUNT += count;

        // 对于独立用户数,取最大值（不能累加,因为可能有重复用户）
        if (uniqueUsers !== undefined) {
          if (existing['COUNT_DISTINCT(user_id)'] === undefined) {
            existing['COUNT_DISTINCT(user_id)'] = uniqueUsers;
          } else {
            existing['COUNT_DISTINCT(user_id)'] = Math.max(
              existing['COUNT_DISTINCT(user_id)'],
              uniqueUsers
            );
          }
        }
      } else {
        // 初始化新 Bot
        const newBot: any = { COUNT: count };
        if (uniqueUsers !== undefined) {
          newBot['COUNT_DISTINCT(user_id)'] = uniqueUsers;
        }
        botMap.set(slugId, newBot);
      }
    }
  }

  // 2. 转换为数组并按 COUNT 降序排序
  const merged = Array.from(botMap.entries()).map(([slug_id, data]) => {
    const result: any = {
      slug_id,
      COUNT: data.COUNT
    };
    if (data['COUNT_DISTINCT(user_id)'] !== undefined) {
      result['COUNT_DISTINCT(user_id)'] = data['COUNT_DISTINCT(user_id)'];
    }
    return result;
  });

  merged.sort((a, b) => b.COUNT - a.COUNT);

  // 3. 计算总计
  const totalCount = merged.reduce((sum, item) => sum + item.COUNT, 0);
  const totalUsers = merged.reduce((sum, item) => {
    const users = item['COUNT_DISTINCT(user_id)'];
    return sum + (users !== undefined ? users : 0);
  }, 0);

  // 4. 添加总计行
  const totalRow: any = { COUNT: totalCount };
  if (totalUsers > 0) {
    totalRow['COUNT_DISTINCT(user_id)'] = totalUsers;
  }
  merged.push(totalRow);

  console.log(`✅ Merged batches: ${totalCount} total events, ${totalUsers} total users (estimated)`);

  return merged;
}

/**
 * 通过 MCP 从 Honeycomb 获取 bot 交互数据（支持分批查询）
 * @param startTime - 查询开始时间（epoch 秒），前端默认传递最近7天
 * @param endTime - 查询结束时间（epoch 秒），前端默认传递当前时间
 * @returns Honeycomb 查询结果的 results 数组
 */
export async function fetchHoneycombData(
  startTime: number = DEFAULT_START_TIME,
  endTime: number = Math.floor(Date.now() / 1000)
) {
  const timeRangeDays = (endTime - startTime) / 86400; // 转换为天数

  // 🔥 对于超过 2 天的查询，强制使用分批查询策略（避免超时）
  // 降低到 2 天是因为即使 3 天的查询也可能超时
  if (timeRangeDays > 2) {
    console.log(`⚡ Large time range detected: ${timeRangeDays.toFixed(1)} days`);
    console.log(`📦 Using batched query strategy (2-day batches, sequential execution)...`);

    // 🔥 改为 2 天批次，更激进的保守策略
    const batchSize = 2 * 86400; // 2 天（秒）
    const batches: Array<{ start: number; end: number }> = [];

    let currentStart = startTime;
    while (currentStart < endTime) {
      const currentEnd = Math.min(currentStart + batchSize, endTime);
      batches.push({ start: currentStart, end: currentEnd });
      currentStart = currentEnd;
    }

    console.log(`📦 Split into ${batches.length} batches (2-day each)`);

    // 🔥 改为串行查询，避免并发导致服务器超载
    const batchResults: any[][] = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const dateRange = `${new Date(batch.start * 1000).toISOString().split('T')[0]} to ${new Date(batch.end * 1000).toISOString().split('T')[0]}`;
      console.log(`  📦 Batch ${i + 1}/${batches.length}: ${dateRange}`);

      // 🔥 添加重试机制（最多重试 4 次）
      let retries = 4;
      let lastError: any = null;

      while (retries >= 0) {
        try {
          const result = await fetchHoneycombDataSingle(batch.start, batch.end);
          batchResults.push(result);
          console.log(`  ✅ Batch ${i + 1}/${batches.length} completed (${result.length} items)`);
          lastError = null;
          break; // 成功，跳出重试循环
        } catch (error) {
          lastError = error;
          retries--;

          if (retries >= 0) {
            const waitTime = 5000; // 等待 5 秒后重试
            console.log(`  ⚠️ Batch ${i + 1}/${batches.length} failed, retrying in ${waitTime / 1000}s... (${retries + 1} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.error(`  ❌ Batch ${i + 1}/${batches.length} failed after all retries:`, error);
            // 所有重试都失败，添加空结果，继续执行其他批次
            batchResults.push([]);
          }
        }
      }

      // 🔥 批次间延迟 3 秒，避免服务器过载（最后一个批次不需要延迟）
      if (i < batches.length - 1 && lastError === null) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`✅ All batches completed, merging results...`);

    // 合并结果
    const mergedResults = mergeBatchResults(batchResults);

    console.log(`✅ Merged ${mergedResults.length - 1} unique bots (+ 1 total row)`);

    return mergedResults;
  }

  // 小时间范围直接查询（≤ 2 天）
  console.log(`📊 Small time range: ${timeRangeDays.toFixed(1)} days - direct query`);
  return fetchHoneycombDataSingle(startTime, endTime);
}

/**
 * 单次查询 Honeycomb 数据（内部函数）
 * @param startTime - 查询开始时间（epoch 秒）
 * @param endTime - 查询结束时间（epoch 秒）
 * @returns Honeycomb 查询结果的 results 数组
 */
async function fetchHoneycombDataSingle(
  startTime: number,
  endTime: number
): Promise<any[]> {
  // 根据时间范围自适应调整查询参数,避免超时
  const timeRangeDays = (endTime - startTime) / 86400; // 转换为天数
  let queryLimit = 100;
  let includeUniqueUsers = true; // 是否包含 COUNT_DISTINCT(user_id)

  // 🔥 对于小时间范围（≤2天）启用 COUNT_DISTINCT，获取独立用户数用于计算平均活跃度
  // 超过 2 天会自动触发分批查询，每个批次都是 ≤2 天，所以可以安全启用
  if (timeRangeDays <= 2) {
    includeUniqueUsers = true;  // 2天以内启用用户数统计
    queryLimit = 200; // 2天以内：最多200个Bot（分批查询后的小批次）
    console.log(`📊 Time range: ${timeRangeDays.toFixed(1)} days - limit 200 bots (with unique users)`);
  } else if (timeRangeDays <= 3) {
    includeUniqueUsers = false; // 2-3天：跳过用户数统计，避免超时
    queryLimit = 150; // 2-3天：最多150个Bot
    console.log(`📊 Time range: ${timeRangeDays.toFixed(1)} days - limit 150 bots (no unique users)`);
  } else {
    // 不应该到这里,因为超过 2 天会触发分批查询
    includeUniqueUsers = false;
    queryLimit = 100;
    console.log(`⚠️ Unexpected time range: ${timeRangeDays.toFixed(1)} days - limit 100 bots (no unique users)`);
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
    // 🔥 移除 output_format 参数,让服务器返回默认的 ASCII 格式
    // output_format: "json",
    disable_total_by_aggregate: false,  // 重要：包含总计行
    enable_series: false  // 🔥 关闭时间序列,加快查询
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

  // 3. 连接到 MCP 服务器（30 秒超时）
  try {
    await connectWithTimeout(client, transport, 30000);
    console.log("✅ Connected to MCP server");
  } catch (error) {
    console.error("❌ Failed to connect to MCP server:", error);
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // 4. 调用 Honeycomb MCP 工具（3 分钟超时）
    const startDate = new Date(startTime * 1000).toISOString();
    const endDate = new Date(endTime * 1000).toISOString();
    console.log(`📊 Querying Honeycomb data from ${startDate} to ${endDate}...`);
    const result = await callToolWithTimeout(
      client,
      {
        name: "honeycomb-run_query",  // MCP 工具名称
        arguments: HONEYCOMB_QUERY_SPEC
      },
      180000 // 3 分钟超时
    ) as MCPToolResult;

    // 5. 解析结果
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
      throw new Error("Invalid MCP response format");
    }

    const responseText = content[0].text;

    // 检测响应格式并解析
    let parsed: { results: any[]; query_url?: string; query_pk?: string };

    if (responseText.trim().startsWith('#')) {
      // ASCII 表格格式 - 使用自定义解析器
      console.log('📄 Parsing ASCII format response...');
      parsed = parseAsciiResponse(responseText);
    } else {
      // JSON 格式 - 直接解析
      console.log('📄 Parsing JSON format response...');
      const jsonParsed = JSON.parse(responseText);

      if (!jsonParsed.success) {
        throw new Error(`Honeycomb query failed: ${jsonParsed.error || "Unknown error"}`);
      }

      parsed = {
        results: jsonParsed.results || [],
        query_url: jsonParsed.query_url,
        query_pk: jsonParsed.query_pk
      };
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

  // 3. 连接到 MCP 服务器（30 秒超时）
  try {
    await connectWithTimeout(client, transport, 30000);
    console.log("✅ Connected to MCP server (login stats)");
  } catch (error) {
    console.error("❌ Failed to connect to MCP server:", error);
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // 查询1: 当前时间范围内的登录数据（3 分钟超时）
    console.log(`📊 Querying login stats for current period...`);
    const currentPeriodResult = await callToolWithTimeout(
      client,
      {
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
          // 🔥 移除 output_format,使用服务器默认格式
          enable_series: false
        }
      },
      180000 // 3 分钟超时
    ) as MCPToolResult;

    // 查询2: 时间范围之前的登录用户（用于判断老用户）（3 分钟超时）
    console.log(`📊 Querying historical users before ${new Date(startTime * 1000).toISOString()}...`);
    const historicalResult = await callToolWithTimeout(
      client,
      {
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
          // 🔥 移除 output_format,使用服务器默认格式
          enable_series: false
        }
      },
      180000 // 3 分钟超时
    ) as MCPToolResult;

    // 解析当前时间范围的结果
    const currentContent = currentPeriodResult.content;
    if (!Array.isArray(currentContent) || currentContent.length === 0 || currentContent[0].type !== "text") {
      throw new Error("Invalid MCP response format for current period");
    }

    const currentResponseText = currentContent[0].text;

    // 检测响应格式并解析
    let currentParsed: { results: any[] };

    if (currentResponseText.trim().startsWith('#')) {
      // ASCII 表格格式
      console.log('📄 Parsing ASCII format for login stats...');
      currentParsed = parseAsciiResponse(currentResponseText);
    } else {
      // JSON 格式
      const jsonParsed = JSON.parse(currentResponseText);
      if (!jsonParsed.success) {
        throw new Error("Login stats query failed");
      }
      currentParsed = { results: jsonParsed.results || [] };
    }

    if (!currentParsed.results || currentParsed.results.length === 0) {
      throw new Error("No login data found for current period");
    }

    const totalLogins = currentParsed.results[0].COUNT || 0;
    const uniqueLoginUsers = currentParsed.results[0]["COUNT_DISTINCT(user_id)"] || 0;

    // 解析历史数据的结果
    const historicalContent = historicalResult.content;
    if (!Array.isArray(historicalContent) || historicalContent.length === 0 || historicalContent[0].type !== "text") {
      throw new Error("Invalid MCP response format for historical data");
    }

    const historicalResponseText = historicalContent[0].text;

    // 检测响应格式并解析
    let historicalParsed: { results: any[] };

    if (historicalResponseText.trim().startsWith('#')) {
      // ASCII 表格格式
      console.log('📄 Parsing ASCII format for historical login data...');
      historicalParsed = parseAsciiResponse(historicalResponseText);
    } else {
      // JSON 格式
      const jsonParsed = JSON.parse(historicalResponseText);
      historicalParsed = {
        results: (jsonParsed.success && jsonParsed.results) ? jsonParsed.results : []
      };
    }

    const historicalUsers = (historicalParsed.results && historicalParsed.results.length > 0)
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

  // 3. 连接到 MCP 服务器（30 秒超时）
  try {
    await connectWithTimeout(client, transport, 30000);
    console.log("✅ Connected to MCP server (user funnel)");
  } catch (error) {
    console.error("❌ Failed to connect to MCP server:", error);
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    console.log(`📊 Querying user funnel data...`);

    // 为每个步骤查询数据
    // 简化版本：直接使用 COUNT 作为近似值，不按天分组（避免查询超时）
    const stepResults = await Promise.all(
      funnelSteps.map(async (step) => {
        try {
          const result = await callToolWithTimeout(
            client,
            {
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
                // 🔥 移除 output_format,使用服务器默认格式
                enable_series: false // 不需要时间序列,加快查询
              }
            },
            120000 // 2 分钟超时（漏斗查询相对简单）
          ) as MCPToolResult;

          // 解析结果
          const content = result.content;
          if (!Array.isArray(content) || content.length === 0 || content[0].type !== "text") {
            throw new Error(`Invalid MCP response format for ${step.eventType}`);
          }

          const responseText = content[0].text;

          // 检测响应格式并解析
          let parsed: { results: any[] };

          if (responseText.trim().startsWith('#')) {
            // ASCII 表格格式
            console.log(`📄 Parsing ASCII format for ${step.eventType}...`);
            parsed = parseAsciiResponse(responseText);
          } else {
            // JSON 格式
            const jsonParsed = JSON.parse(responseText);
            if (!jsonParsed.success) {
              console.warn(`Query failed for ${step.eventType}`);
              return { ...step, userDayCount: 0 };
            }
            parsed = { results: jsonParsed.results || [] };
          }

          if (!parsed.results || parsed.results.length === 0) {
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
