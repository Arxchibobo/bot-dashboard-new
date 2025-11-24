# 数据查询超时问题报告

生成时间：2025-11-21

## 问题概述

在查询 29.7 天时间范围（2025-10-23 到 2025-11-21）的数据时，发生了多个查询超时，导致返回空白数据。

### 失败的查询

#### 1. ❌ Bot 数据查询 (主查询)
- **状态**: 超时失败
- **耗时**: ~60 秒
- **错误**: MCP error -32001: Request timed out
- **影响**: 返回 0 个 Bot，所有 Bot 列表为空

#### 2. ❌ 登录统计查询 (Login Stats)
- **状态**: 超时失败
- **耗时**: ~60 秒
- **错误**: MCP error -32001: Request timed out
- **影响**: 无法显示登录用户统计（新用户、老用户）

#### 3. ✅ 用户行为漏斗查询 (User Funnel)
- **状态**: 成功
- **结果**:
  - 认证成功: 109,345 user-days
  - 开始上传: 87,905 user-days
  - 开始生成: 82,554 user-days
  - 点击下载: 12,607 user-days
  - 点击分享: 934 user-days

---

## 详细查询参数分析

### 1. Bot 数据查询 (fetchHoneycombData)

**查询位置**: `lib/honeycomb-mcp-client.ts:14-129`

**查询参数**:
```javascript
{
  environment_slug: "dev",
  dataset_slug: "myshell-art-web",
  query_spec: {
    calculations: [
      { op: "COUNT" }
      // ⚠️ 已禁用 COUNT_DISTINCT(user_id) 以优化性能
    ],
    breakdowns: ["slug_id"],
    start_time: 1760486400,  // 2025-10-23 00:00:00
    end_time: 1732202399,    // 2025-11-21 23:59:59
    filters: [
      { column: "slug_id", op: "exists" }
    ],
    orders: [
      { op: "COUNT", order: "descending" }
    ],
    limit: 30  // ⚡ 因为超过 20 天，自动降低到 30
  },
  output_format: "json",
  disable_total_by_aggregate: false,
  enable_series: false  // 🔥 已关闭时间序列以加快查询
}
```

**需要的字段**:
- `slug_id` - Bot 的唯一标识符
- `COUNT` - 事件总数

**缺失的字段**（因性能优化被禁用）:
- ❌ `COUNT_DISTINCT(user_id)` - 唯一用户数（已在代码中禁用以避免超时）

**问题原因**:
1. 时间范围 29.7 天，数据量巨大
2. Honeycomb 查询引擎处理大范围查询时可能超时
3. 即使已优化参数（limit: 30, enable_series: false），仍然超时

---

### 2. 登录统计查询 (fetchLoginStats)

**查询位置**: `lib/honeycomb-mcp-client.ts:137-249`

**查询 2.1 - 当前时间范围登录数据**:
```javascript
{
  environment_slug: "dev",
  dataset_slug: "myshell-art-web",
  query_spec: {
    calculations: [
      { op: "COUNT" },
      { op: "COUNT_DISTINCT", column: "user_id" }  // ⚠️ 计算密集型操作
    ],
    start_time: 1760486400,
    end_time: 1732202399,
    filters: [
      { column: "name", op: "=", value: "auth_success_art" },
      { column: "user_id", op: "exists" }
    ]
  },
  output_format: "json",
  enable_series: false
}
```

**查询 2.2 - 历史用户数据**:
```javascript
{
  environment_slug: "dev",
  dataset_slug: "myshell-art-web",
  query_spec: {
    calculations: [
      { op: "COUNT_DISTINCT", column: "user_id" }  // ⚠️ 计算密集型操作
    ],
    start_time: 1727020800,  // 从 2025-09-22 开始
    end_time: 1760486399,    // 到当前范围之前
    filters: [
      { column: "name", op: "=", value: "auth_success_art" },
      { column: "user_id", op: "exists" }
    ]
  },
  output_format: "json",
  enable_series: false
}
```

**需要的字段**:
- `COUNT` - 登录次数
- `COUNT_DISTINCT(user_id)` - 唯一登录用户数
- `user_id` - 用户ID（用于去重计数）

**问题原因**:
1. **COUNT_DISTINCT(user_id) 是计算密集型操作**，在大数据集上非常慢
2. 查询 2.2 需要扫描更长的历史时间范围（~60 天）
3. 两个查询虽然并行执行，但每个都可能独立超时

---

### 3. 用户行为漏斗查询 (fetchUserFunnel) ✅ 成功

**查询位置**: `lib/honeycomb-mcp-client.ts:260-381`

**每个步骤的查询**（共 5 个步骤，并行执行）:
```javascript
// 示例：认证成功步骤
{
  environment_slug: "dev",
  dataset_slug: "myshell-art-web",
  query_spec: {
    calculations: [
      { op: "COUNT" }  // ✅ 只使用 COUNT，不用 COUNT_DISTINCT
    ],
    start_time: 1760486400,
    end_time: 1732202399,
    filters: [
      { column: "name", op: "=", value: "auth_success_art" },
      { column: "user_id", op: "exists" }
    ]
  },
  output_format: "json",
  enable_series: false
}
```

**查询的事件类型**:
1. `auth_success_art` - 认证成功
2. `image_upload_start_art` - 开始上传
3. `generation_start_art` - 开始生成
4. `download_click_art` - 点击下载
5. `share_click_art` - 点击分享

**需要的字段**:
- `COUNT` - 事件总数（作为 user-day 近似值）

**成功原因**:
1. 只使用 COUNT 操作，不使用 COUNT_DISTINCT
2. 每个查询过滤特定的事件类型，数据量小
3. 5 个查询并行执行，单个查询速度快

---

## 超时配置分析

### 当前超时设置

#### 1. Next.js API 路由
- **文件**: `app/api/data/route.ts`
- **配置**: ❌ 未设置超时时间
- **默认超时**:
  - Vercel 部署: 10 秒（Hobby）/ 60 秒（Pro）
  - 自托管: 无限制或由服务器配置决定
- **实际表现**: 约 60 秒后超时

#### 2. MCP 客户端 (SDK)
- **文件**: `lib/honeycomb-mcp-client.ts`
- **配置**: ❌ 未显式设置超时时间
- **SDK 默认**: 需要查看 `@modelcontextprotocol/sdk` 文档
- **问题**: `client.callTool()` 没有传入 timeout 参数

#### 3. Honeycomb MCP Server
- **服务器地址**: `http://52.12.230.109:3000/mcp`
- **配置**: ❌ 未知（服务器端配置）
- **问题**: 可能有自己的查询超时限制

---

## 根本原因总结

### 为什么 Bot 查询超时？

1. **数据量问题**:
   - 29.7 天时间范围
   - `slug_id` breakdown 导致需要扫描所有事件
   - 即使 limit 设为 30，Honeycomb 仍需要扫描全部数据来排序

2. **查询优化不足**:
   - 已禁用 `COUNT_DISTINCT(user_id)`
   - 已禁用时间序列 (`enable_series: false`)
   - 已降低 limit 到 30
   - **但仍然超时，说明核心问题是时间范围太长**

3. **超时配置缺失**:
   - API 路由没有设置足够的超时时间
   - MCP 客户端可能有默认的较短超时时间

### 为什么 Login Stats 查询超时？

1. **COUNT_DISTINCT 计算开销**:
   - 需要去重统计所有 `user_id`
   - 在大数据集上需要大量内存和计算时间

2. **双查询开销**:
   - 需要执行两个独立的查询
   - 虽然并行执行，但每个都可能超时

3. **历史数据范围长**:
   - 查询 2.2 需要扫描 ~60 天的历史数据

### 为什么 User Funnel 查询成功？

1. **查询简单**:
   - 只使用 COUNT，不用 COUNT_DISTINCT
   - 精确的事件类型过滤

2. **数据量小**:
   - 每个事件类型的数据量相对较小
   - 5 个查询并行执行，单个查询快速完成

---

## 解决方案

### 方案 1: 增加超时时间 ⏱️

#### 1.1 配置 Next.js API 路由超时

在 `app/api/data/route.ts` 中添加：

```typescript
// 设置 API 路由超时时间为 5 分钟 (300 秒)
export const maxDuration = 300; // Next.js 14+ 支持
```

或者在 `next.config.js` 中全局配置：

```javascript
module.exports = {
  // ...
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // API 路由超时 (仅适用于某些托管平台)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-API-Timeout',
            value: '300',
          },
        ],
      },
    ];
  },
};
```

#### 1.2 配置 MCP 客户端超时

修改 `lib/honeycomb-mcp-client.ts` 中的 MCP 调用，添加超时控制：

```typescript
// 方案 A: 包装 Promise.race 实现超时
const queryWithTimeout = (
  client: Client,
  params: any,
  timeoutMs: number = 180000 // 3 分钟
) => {
  return Promise.race([
    client.callTool(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
};

// 使用示例
const result = await queryWithTimeout(client, {
  name: "honeycomb-run_query",
  arguments: HONEYCOMB_QUERY_SPEC
}, 180000); // 3 分钟超时
```

**推荐超时时间**:
- Bot 数据查询: 180 秒（3 分钟）
- Login Stats 查询: 180 秒（3 分钟）
- User Funnel 查询: 120 秒（2 分钟）

---

### 方案 2: 优化查询策略 🚀

#### 2.1 Bot 数据查询优化

**问题**: 大时间范围查询超时

**解决方案 A: 分批查询**

```typescript
// 将 29 天拆分为多个小范围查询
async function fetchHoneycombDataBatched(
  startTime: number,
  endTime: number,
  batchDays: number = 7 // 每批 7 天
) {
  const batches = [];
  let currentStart = startTime;

  while (currentStart < endTime) {
    const currentEnd = Math.min(currentStart + batchDays * 86400, endTime);
    batches.push({ start: currentStart, end: currentEnd });
    currentStart = currentEnd;
  }

  // 并行查询所有批次
  const results = await Promise.all(
    batches.map(batch => fetchHoneycombData(batch.start, batch.end))
  );

  // 合并结果
  return mergeBotResults(results);
}
```

**解决方案 B: 使用采样查询**

```typescript
// 对于大时间范围，使用采样以减少数据量
const HONEYCOMB_QUERY_SPEC = {
  // ...
  query_spec: {
    // ...
    // 添加采样（仅处理 10% 的数据）
    // 注意: 需要 Honeycomb 支持采样语法
  }
}
```

#### 2.2 Login Stats 查询优化

**问题**: COUNT_DISTINCT 在大数据集上很慢

**解决方案 A: 使用 HyperLogLog 近似计数**

```typescript
// 如果 Honeycomb 支持 HLL
calculations: [
  { op: "COUNT" },
  { op: "HLLCOUNT", column: "user_id" }  // 近似去重计数，速度快
]
```

**解决方案 B: 取消 Login Stats 查询**

```typescript
// 如果 Login Stats 不是核心功能，可以暂时禁用
const skipLoginStats = timeRangeDays > 20; // 超过 20 天时跳过

if (!skipLoginStats) {
  // 执行查询
}
```

**解决方案 C: 缓存历史用户数据**

```typescript
// 缓存历史用户统计，避免每次都查询
const cachedHistoricalUsers = await getCachedHistoricalUsers();
if (!cachedHistoricalUsers) {
  // 只在缓存失效时查询
  const result = await fetchHistoricalUsers();
  await cacheHistoricalUsers(result, 24 * 60 * 60); // 缓存 24 小时
}
```

---

### 方案 3: 数据库层优化 💾

#### 3.1 使用 Honeycomb Derived Columns

**问题**: 实时计算 COUNT_DISTINCT 慢

**解决**: 在 Honeycomb 中创建预计算的 Derived Column

1. 进入 Honeycomb 控制台
2. 创建 Derived Column: `daily_unique_users`
3. 定义计算规则（按天预聚合用户数）
4. 查询时使用预计算列

```typescript
calculations: [
  { op: "SUM", column: "daily_unique_users" }  // 快速求和
]
```

#### 3.2 创建 Materialized View (如果 Honeycomb 支持)

预聚合常用查询的结果，定期更新。

---

### 方案 4: 异步处理 + 轮询 🔄

#### 4.1 后台任务处理

**思路**: 将耗时查询放到后台任务，前端轮询结果

```typescript
// 1. 发起查询，返回任务 ID
POST /api/data/start-query
→ { taskId: "abc123", status: "pending" }

// 2. 轮询任务状态
GET /api/data/query-status?taskId=abc123
→ { status: "running", progress: 60 }

// 3. 获取结果
GET /api/data/query-result?taskId=abc123
→ { status: "completed", data: {...} }
```

**优点**:
- 不受 API 路由超时限制
- 可以显示进度
- 支持取消操作

**缺点**:
- 需要实现任务队列和存储
- 前端需要轮询逻辑

---

## 推荐实施步骤 📋

### 短期方案（立即实施）

1. ✅ **增加 API 路由超时时间**
   - 在 `app/api/data/route.ts` 添加 `export const maxDuration = 300`
   - 修改为 5 分钟超时

2. ✅ **增加 MCP 客户端超时时间**
   - 包装 `client.callTool()` 添加 180 秒超时
   - 提供更清晰的超时错误信息

3. ✅ **优化 Login Stats 查询**
   - 对于超过 20 天的查询，暂时跳过 Login Stats
   - 显示提示信息："时间范围较长，部分统计数据已禁用"

### 中期方案（本周内）

4. ⏳ **实现分批查询**
   - Bot 数据按 7 天批次查询
   - 并行执行多个批次
   - 前端显示加载进度

5. ⏳ **添加查询缓存**
   - 缓存历史用户数据（24 小时）
   - 缓存 Bot 数据（1 小时）

### 长期方案（下周起）

6. 🔮 **实现异步查询系统**
   - 后台任务队列
   - 前端轮询机制
   - 进度条显示

7. 🔮 **Honeycomb 数据结构优化**
   - 创建 Derived Columns
   - 优化索引

---

## 立即可用的测试建议 🧪

### 测试较短时间范围

1. **测试 7 天范围**:
   ```
   startDate: 2025-11-15
   endDate: 2025-11-21
   ```
   预期结果：✅ 应该成功，不超时

2. **测试 14 天范围**:
   ```
   startDate: 2025-11-08
   endDate: 2025-11-21
   ```
   预期结果：✅ 可能成功，或轻微超时

3. **测试 30 天范围**:
   ```
   startDate: 2025-10-23
   endDate: 2025-11-21
   ```
   当前结果：❌ 超时
   修复后预期：✅ 成功（超时时间增加后）

---

## 需要的字段总结 📊

### Bot 数据
- ✅ `slug_id` - Bot ID
- ✅ `COUNT` - 事件数量
- ❌ `COUNT_DISTINCT(user_id)` - 唯一用户数（已禁用，需优化后重新启用）

### Login Stats
- ✅ `COUNT` - 登录次数
- ❌ `COUNT_DISTINCT(user_id)` - 唯一登录用户（当前无法获取）
- ❌ `user_id` - 用户ID列表（需要用于新老用户区分）

### User Funnel
- ✅ `COUNT` - 各步骤事件数量
- ✅ `name` - 事件类型
- ✅ `user_id` - 用户ID（仅用于过滤）

---

## 附录：完整错误信息

```
⚡ Time range: 29.7 days - limit 30 bots, no user count
✅ Connected to MCP server
📊 Querying Honeycomb data from 2025-10-23T00:00:00.000Z to 2025-11-21T15:59:59.000Z...
📊 Querying login stats for current period...
📊 Querying user funnel data...
  认证成功 (auth_success_art): 109345 user-days
  开始生成 (generation_start_art): 82554 user-days
  开始上传 (image_upload_start_art): 87905 user-days
  点击分享 (share_click_art): 934 user-days
  点击下载 (download_click_art): 12607 user-days
✅ Funnel calculated: 认证成功=109345 -> 开始上传=87905 -> 开始生成=82554 -> 点击下载=12607 -> 点击分享=934
⚠️ Login stats query failed: MCP error -32001: Request timed out
⚠️ Bot data query failed, returning partial data: MCP error -32001: Request timed out
✅ API 返回数据: 0 个 Bot
GET /api/data?startDate=2025-10-23&endDate=2025-11-21 200 in 60455ms
GET /api/data?startDate=2025-10-23&endDate=2025-11-21 200 in 60449ms
```

---

## 联系信息

如有疑问，请联系：
- 开发者: Claude Code
- 生成时间: 2025-11-21
- 项目: bot-dashboard
