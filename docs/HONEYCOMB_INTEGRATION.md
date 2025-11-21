# Honeycomb 数据集成指南

## 📖 概述

本文档说明如何从 Honeycomb 获取 bot 交互数据并更新到仪表盘。

由于 Honeycomb MCP 工具需要在特定的上下文环境中运行，我们提供了一个两步流程来实现数据更新：

1. 通过 mcphub 从 Honeycomb 查询数据
2. 使用转换脚本将数据转换并保存

---

## 🎯 适用场景

- ✅ 当需要更新仪表盘数据时
- ✅ 当前对话上下文较长，无法直接查询时
- ✅ 需要定期更新数据时

---

## 🛠️ 前置条件

在开始之前，请确保：

1. ✅ 已安装 Node.js（v14 或更高版本）
2. ✅ 已安装项目依赖（运行过 `npm install`）
3. ✅ 可以访问 Claude Code 和 mcphub
4. ✅ 有 Honeycomb 数据访问权限

---

## 📋 完整流程

### 步骤 1：查询 Honeycomb 数据

#### 1.1 准备查询命令

在 Claude Code 中，使用以下命令查询数据：

```
请使用 Honeycomb MCP 工具查询过去 7 天的 bot 交互数据，并以 JSON 格式返回：

工具：mcp__mcphub__honeycomb-run_query

参数：
{
  "environment_slug": "dev",
  "dataset_slug": "myshell-art-web",
  "query_spec": {
    "calculations": [
      {"op": "COUNT"},
      {"op": "COUNT_DISTINCT", "column": "user_id"}
    ],
    "breakdowns": ["slug_id"],
    "time_range": 604800,
    "filters": [
      {"column": "slug_id", "op": "exists"}
    ],
    "orders": [
      {"op": "COUNT", "order": "descending"}
    ],
    "limit": 100
  },
  "output_format": "json",
  "disable_total_by_aggregate": false
}
```

#### 1.2 理解查询参数

| 参数 | 说明 |
|------|------|
| `environment_slug` | Honeycomb 环境标识（dev/production） |
| `dataset_slug` | 数据集名称（myshell-art-web） |
| `time_range` | 时间范围（604800 = 7天，单位：秒） |
| `breakdowns` | 分组字段（按 slug_id 分组） |
| `calculations` | 聚合计算（COUNT 和独立用户数） |
| `limit` | 返回记录数（100 条） |
| `output_format` | 输出格式（JSON） |

#### 1.3 执行查询

- 如果在当前会话中上下文较短，可以直接查询
- 如果提示 "Input is too long"，建议开启新的 Claude Code 会话

#### 1.4 获取查询结果

查询成功后，您会收到类似这样的 JSON 结果：

```json
{
  "results": [
    {
      "slug_id": "faceswap-diy",
      "COUNT": 37388,
      "COUNT_DISTINCT(user_id)": 5417
    },
    {
      "slug_id": "linkedin-profile-maker",
      "COUNT": 28456,
      "COUNT_DISTINCT(user_id)": 3210
    },
    {
      "COUNT": 563853,
      "COUNT_DISTINCT(user_id)": 45986
    }
  ],
  "query_url": "https://ui.honeycomb.io/...",
  "query_pk": "QR-xxx..."
}
```

**注意**：results 数组中最后一条没有 `slug_id` 的记录是总计行。

---

### 步骤 2：保存查询结果

#### 2.1 复制完整的 JSON 结果

确保复制完整的 JSON 对象，包括：
- `results` 数组
- `query_url`
- `query_pk`

#### 2.2 打开模板文件

使用文本编辑器打开：
```
bot-dashboard/scripts/honeycomb-raw.json
```

#### 2.3 粘贴查询结果

**完全替换**文件内容，粘贴您刚才复制的 JSON 结果。

**保存前检查**：
- ✅ JSON 格式正确（没有语法错误）
- ✅ 包含 `results` 数组
- ✅ `results` 数组不为空

#### 2.4 保存文件

保存 `honeycomb-raw.json` 文件。

---

### 步骤 3：运行转换脚本

#### 3.1 打开终端

在项目根目录打开终端（Git Bash 或命令提示符）。

#### 3.2 执行转换命令

```bash
cd "e:/Bobo's Coding cache/bot-dashboard"
npm run update-data
```

或者直接运行：

```bash
node scripts/transform-honeycomb-data.js
```

#### 3.3 查看输出

脚本会显示详细的处理过程：

```
🚀 开始转换 Honeycomb 数据...

📖 读取原始数据文件...
✅ 原始数据读取成功

🔍 验证数据格式...
✅ 数据格式验证通过（共 101 条记录）

🔄 转换数据格式...
📊 找到总计行
✅ 数据转换完成（共 100 个 Bot）

💾 保存数据到文件...
✅ 数据已保存到: data/bot-interactions.json

📈 数据统计：
──────────────────────────────────────────────────
总事件数：     563,853
总独立用户数： 45,986
Bot 数量：     100
最后更新：     2025-01-12 10:30:00
──────────────────────────────────────────────────

🏆 Top 5 Bot（按事件数排序）：
──────────────────────────────────────────────────
1. faceswap-diy
   事件数: 37,388, 独立用户: 5,417, 平均活跃度: 6.9
2. linkedin-profile-maker
   事件数: 28,456, 独立用户: 3,210, 平均活跃度: 8.9
...
──────────────────────────────────────────────────

✅ 数据转换完成！

💡 下一步：
   1. 访问 http://localhost:3000
   2. 点击"刷新数据"按钮或刷新浏览器页面
   3. 查看更新后的数据
```

---

### 步骤 4：刷新网页查看数据

#### 4.1 访问仪表盘

在浏览器中打开：
```
http://localhost:3000
```

#### 4.2 刷新数据

两种方式：
- **方式 1**：点击页面上的"刷新数据"按钮
- **方式 2**：按 `Ctrl + R` 或 `F5` 刷新浏览器页面

#### 4.3 验证更新

检查以下内容：
- ✅ 统计卡片显示最新数据
- ✅ 数据表格包含所有 Bot
- ✅ "最后更新"时间是当前时间

---

## 🔧 高级配置

### 修改查询参数

您可以根据需要调整查询参数：

#### 修改时间范围

```javascript
// 3 天
"time_range": 259200

// 14 天
"time_range": 1209600

// 30 天
"time_range": 2592000
```

#### 修改返回数量

```javascript
// 返回前 50 个 Bot
"limit": 50

// 返回前 200 个 Bot
"limit": 200

// 返回所有 Bot（慎用，可能数据量很大）
"limit": 10000
```

#### 添加额外过滤条件

```javascript
"filters": [
  {"column": "slug_id", "op": "exists"},
  {"column": "user_id", "op": "exists"},  // 只统计有用户ID的事件
  {"column": "event.name", "op": "=", "value": "page_view"}  // 特定事件类型
]
```

---

## 🔍 故障排除

### 问题 1：找不到 honeycomb-raw.json

**错误信息**：
```
找不到文件: scripts/honeycomb-raw.json
```

**解决方案**：
1. 确认文件路径正确
2. 确认文件已保存
3. 检查文件名拼写（注意大小写）

---

### 问题 2：JSON 格式错误

**错误信息**：
```
解析 JSON 文件失败: Unexpected token...
```

**解决方案**：
1. 使用 JSON 验证工具检查格式：https://jsonlint.com/
2. 确保复制了完整的 JSON（包括开始的 `{` 和结束的 `}`）
3. 检查是否有多余的逗号或引号

---

### 问题 3：缺少 results 数组

**错误信息**：
```
数据格式错误：缺少 results 数组
```

**解决方案**：
1. 确认保存的是 Honeycomb 查询结果（不是其他数据）
2. 检查 JSON 结构是否完整
3. 重新执行查询并保存

---

### 问题 4：数据为空

**错误信息**：
```
数据为空：results 数组中没有数据
```

**解决方案**：
1. 检查 Honeycomb 查询条件
2. 确认时间范围内有数据
3. 尝试放宽过滤条件

---

### 问题 5：totalUsers 为 0

**警告信息**：
```
⚠️ 未找到总计行，totalUsers 可能不准确
```

**说明**：
- 这是因为查询结果中没有总计行（没有 `slug_id` 的记录）
- 确保查询参数中 `disable_total_by_aggregate` 设置为 `false`

**解决方案**：
```javascript
{
  // ... 其他参数
  "disable_total_by_aggregate": false  // 确保包含总计行
}
```

---

## ❓ 常见问题

### Q1：多久需要更新一次数据？

**A**：取决于您的需求：
- 开发测试阶段：按需更新
- 生产环境：建议每天更新一次
- 高频场景：可以每小时更新一次

### Q2：可以自动化这个流程吗？

**A**：目前需要手动执行，因为 Honeycomb MCP 工具只能在 Claude Code 环境中使用。

未来可能的自动化方案：
- 使用 Honeycomb API（需要 API Key）
- 配置定时任务（需要独立的认证方式）

### Q3：数据量很大时会不会很慢？

**A**：转换脚本性能很好，处理 1000+ 条记录只需几秒钟。

如果数据量超过 10,000 条：
- 考虑减少 `limit` 参数
- 或者分批查询和转换

### Q4：如何查看历史数据？

**A**：当前方案每次更新都会覆盖旧数据。

如果需要保留历史：
1. 在运行脚本前备份 `data/bot-interactions.json`
2. 或者修改脚本添加时间戳后缀

### Q5：可以查询其他数据集吗？

**A**：可以！修改查询参数中的 `dataset_slug`：

```javascript
{
  "dataset_slug": "your-dataset-name",
  // ... 其他参数
}
```

---

## 📚 相关文档

- [Honeycomb Query API 文档](https://docs.honeycomb.io/api/query-api/)
- [项目 README](../README.md)
- [数据类型定义](../lib/types.ts)

---

## 💡 提示与技巧

### 技巧 1：快速测试

在修改查询参数前，先用小的 `limit` 值测试：

```javascript
"limit": 10  // 先测试 10 条
```

确认正确后再增加到目标值。

### 技巧 2：保存查询模板

将您常用的查询命令保存到文本文件中，以便快速复用。

### 技巧 3：数据备份

在重要更新前，备份现有数据：

```bash
cp data/bot-interactions.json data/bot-interactions.backup.json
```

### 技巧 4：查看查询 URL

查询结果中的 `query_url` 可以在 Honeycomb UI 中打开，查看可视化结果。

---

## 🆘 获取帮助

如果遇到问题：

1. 检查本文档的"故障排除"章节
2. 查看脚本的错误提示信息
3. 在项目中提交 Issue
4. 联系 Claude Code 获取帮助

---

**最后更新**：2025-01-12
