# Bot 交互数据仪表盘

这是一个展示 Bot 交互数据的 Next.js 应用程序。

## 功能特性

- 📊 展示过去 3 天的 Bot 交互统计
- 🔍 支持搜索和排序
- 📄 分页显示数据（每页 20 条）
- 🔄 一键从 Honeycomb 更新数据
- ♻️ 手动重新加载本地数据

## ⚡ 一键更新数据

本项目使用 **Claude Code + MCP 工具**来获取最新的 Honeycomb 数据。

### 使用步骤

1. **点击"从 Honeycomb 更新"按钮**
   - 指令会自动复制到剪贴板："请刷新 bot-dashboard 数据"

2. **切换到 Claude Code 窗口**
   - 粘贴指令并发送（Ctrl+V / Cmd+V）

3. **Claude 自动处理**
   - 使用 MCP 工具查询 Honeycomb
   - 转换数据格式
   - 更新 `data/bot-interactions.json` 文件

4. **返回浏览器**
   - 点击"重新加载数据"按钮
   - 查看最新的 Bot 交互数据

### 两种刷新方式对比

| 方式 | 功能 | 数据来源 |
|------|------|----------|
| 🔄 **重新加载数据** | 从本地 JSON 文件重新读取数据 | `data/bot-interactions.json` |
| ⬇️ **从 Honeycomb 更新** | 通过 Claude + MCP 获取最新数据并更新文件 | Honeycomb API (通过 MCP) |

### 优势

✅ 无需配置 API Key
✅ 利用 Claude Code 的 MCP 工具能力
✅ 数据获取过程可见、可控
✅ 避免权限问题

---

## 📚 其他数据刷新方式

除了网页上的一键更新，您还可以使用命令行方式：

### 方式1：使用 Claude Code（无需配置）

详细步骤请参考：[Honeycomb 数据集成指南](docs/HONEYCOMB_INTEGRATION.md)

简要步骤：
1. 通过 Claude Code 查询 Honeycomb
2. 保存结果到 `scripts/honeycomb-raw.json`
3. 运行 `npm run update-data`
4. 刷新网页

### 方式2：手动运行转换脚本

如果您已经有数据保存在 `scripts/honeycomb-raw.json`：

```bash
npm run update-data
```

---

## 🚀 快速启动

### 方式1：一键启动脚本（推荐）⭐

#### 开发环境（支持热重载）

**Windows 用户**：双击运行 `start-dev.bat`

**Git Bash / Linux / Mac 用户**：
```bash
./start.sh
```

#### 生产环境（最佳性能）

**Windows 用户**：双击运行 `start-prod.bat`

**Git Bash / Linux / Mac 用户**：
```bash
./start-prod.sh
```

#### 启动脚本功能 ✨

一键启动脚本会自动完成以下操作，无需手动干预：

✅ **[1/5] 检查环境**
  - 检测 Node.js 和 npm 是否安装
  - 显示版本信息

✅ **[2/5] 检查依赖**
  - 自动检测 `node_modules` 是否存在
  - 缺失时自动运行 `npm install`

✅ **[3/5] 检查构建**（仅生产环境）
  - 检测是否已构建
  - 自动运行 `npm run build` 生成生产版本

✅ **[4/5] 检查端口**
  - 检查端口 3002 是否被占用
  - **自动清理**占用该端口的进程（无需确认）

✅ **[5/5] 启动服务器**
  - 询问是否自动打开浏览器（默认是）
  - 启动开发/生产服务器
  - 显示访问地址

### 方式2：手动启动

```bash
# 1. 安装依赖
npm install

# 2a. 启动开发服务器（支持热重载）
npm run dev

# 2b. 或启动生产服务器（需先构建）
npm run build
npm run start
```

访问 http://localhost:3002 查看仪表盘。

---

## 🌐 内网穿透（临时分享）

### 一键启动（含密码保护）⭐
双击运行：`start-with-ngrok.bat`

**功能**：
- ✅ 自动启动 Dashboard 服务器
- ✅ 自动启动 ngrok 内网穿透
- ✅ 生成临时公网地址
- ✅ 密码保护（密码：`Myshell.ai`）

**使用场景**：
- 临时分享给同事/客户查看（<10人）
- 远程演示和讲解
- 快速测试公网访问

**使用步骤**：
1. 双击 `start-with-ngrok.bat`
2. 等待启动，查看 ngrok 显示的公网地址
3. 复制地址（如 `https://xxxx-xxxx.ngrok-free.app`）
4. 发送给需要访问的人，告知密码：`Myshell.ai`
5. 访问者打开链接，输入密码即可查看

**注意事项**：
- ⚠️ 每次重启地址会变化
- 🔒 需要密码才能访问
- ⏱️ 免费版限制：40个连接/分钟
- 📱 适合临时分享，不适合长期使用

**前置要求**：需要安装 [ngrok](https://ngrok.com/download)

详细指南：[docs/TUNNEL_SIMPLE_GUIDE.md](docs/TUNNEL_SIMPLE_GUIDE.md)

---

### 端口配置

默认端口：`3002`

如需修改端口，请编辑 `package.json` 中的脚本：

```json
"scripts": {
  "dev": "next dev -p 你的端口号",
  "start": "next start -p 你的端口号"
}
```

## 技术栈

- **Next.js 14** (App Router) - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Honeycomb API** - 数据源

## 项目结构

```
bot-dashboard/
├── app/              # Next.js App Router 页面
│   ├── api/          # API 路由
│   └── page.tsx      # 主页面
├── components/       # React 组件
│   ├── data-actions.tsx  # 数据操作按钮（复制指令到剪贴板）
│   ├── bot-table.tsx     # Bot 数据表格
│   ├── stats-cards.tsx   # 统计卡片
│   └── ...
├── lib/              # 工具函数和类型定义
│   └── types.ts          # TypeScript 类型定义
├── data/             # 数据存储
│   └── bot-interactions.json  # Bot 交互数据
├── scripts/          # 数据转换脚本
└── docs/             # 文档
```

## 开发指南

### 添加新功能

1. 在 `components/` 目录下创建新组件
2. 在 `lib/types.ts` 中定义类型
3. 在 `app/page.tsx` 中集成新功能

### 修改样式

1. 全局样式：编辑 `app/globals.css`
2. 组件样式：使用 Tailwind CSS 类名
3. 主题配置：修改 `tailwind.config.ts`

## 常见问题

**Q: 如何更新 Honeycomb 数据？**

A: 点击仪表盘上的"从 Honeycomb 更新"按钮，指令会自动复制到剪贴板。然后粘贴到 Claude Code 中执行即可。

**Q: 点击"从 Honeycomb 更新"按钮后需要做什么？**

A:
1. 确认指令已复制到剪贴板（会显示提示信息）
2. 切换到 Claude Code 窗口
3. 粘贴并发送指令
4. 等待 Claude 完成数据更新
5. 返回浏览器，点击"重新加载数据"

**Q: 如何修改每页显示的数据条数？**

A: 编辑 `components/bot-table.tsx` 中的 `pageSize` 变量。

**Q: 如何添加更多统计指标？**

A: 在 `components/stats-cards.tsx` 中添加新的卡片组件，并更新 `lib/types.ts` 中的类型定义。

**Q: 数据来源是什么？**

A: 数据来自 Honeycomb 的 `myshell-art-web` 数据集，包含过去 3 天的 bot 交互记录。

## 许可证

MIT
