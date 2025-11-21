# 内网穿透快速指南（简化版）

本指南介绍如何使用 ngrok 快速实现内网穿透，让外网用户临时访问你的 Bot Dashboard。

## 🚀 一键启动

### 步骤1：双击启动
双击运行：`start-with-ngrok.bat`

脚本会自动完成：
- ✅ 检查 Node.js 环境
- ✅ 安装依赖（如果缺失）
- ✅ 检查 ngrok 是否安装
- ✅ 清理占用的端口
- ✅ 启动 Dashboard 服务器
- ✅ 启动 ngrok 内网穿透

### 步骤2：获取公网地址

启动后，ngrok 会显示类似的信息：

```
Session Status                online
Account                       Free (ngrok.com)
Version                       3.x
Region                        Asia Pacific (ap)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-1234-5678.ngrok-free.app -> http://localhost:3002
```

**重要**：找到 `Forwarding` 行中的 HTTPS 地址（如 `https://abcd-1234-5678.ngrok-free.app`）

### 步骤3：分享地址

将获取的公网地址和密码发送给需要访问的人：

```
访问地址：https://abcd-1234-5678.ngrok-free.app
访问密码：Myshell.ai
```

### 步骤4：访问 Dashboard

访问者打开链接后：
1. 看到登录页面
2. 输入密码：`Myshell.ai`
3. 点击"登录"按钮
4. 成功进入 Dashboard

---

## 📝 注意事项

### 1. 地址每次都会变化
- ⚠️ 每次重启 ngrok 会生成新的随机地址
- 需要重新分享给其他人
- 如需固定地址，建议使用付费版 ngrok 或 Cloudflare Tunnel

### 2. 保持服务器运行
- 不要关闭命令行窗口
- 关闭窗口会停止所有服务
- 如需临时最小化，点击最小化按钮即可

### 3. 停止服务
**方法1**：在命令行窗口按 `Ctrl+C`
**方法2**：直接关闭窗口

停止后会自动清理所有进程。

### 4. 密码保护
- 密码：`Myshell.ai`（区分大小写）
- Cookie 有效期：24小时
- 清除浏览器 Cookie 会要求重新登录

### 5. 免费版限制
ngrok 免费版限制：
- ⏱️ 连接数：40个/分钟
- 🔄 每次启动地址会变
- 🌐 足够临时分享使用

---

## ❓ 常见问题

### Q: 提示"未安装 ngrok"？

**A**: 需要先安装 ngrok

**方法1：手动下载（推荐）**
1. 访问 https://ngrok.com/download
2. 下载 Windows 版本
3. 解压到任意目录（如 `C:\ngrok`）
4. 将 `ngrok.exe` 所在目录添加到系统 PATH

**添加到 PATH 步骤**：
1. 右键"此电脑" → 属性
2. 高级系统设置 → 环境变量
3. 在"系统变量"中找到 Path
4. 点击"编辑" → "新建"
5. 输入 ngrok.exe 所在路径
6. 确定保存
7. 重启命令行窗口

**方法2：使用 Chocolatey**
```bash
choco install ngrok
```

**方法3：使用 Scoop**
```bash
scoop install ngrok
```

### Q: ngrok 显示 "ERR_NGROK_108"？

**A**: 这是 ngrok 账号限制

**解决方法**：
1. 访问 https://ngrok.com/
2. 注册免费账号
3. 获取 authtoken
4. 运行命令：`ngrok config add-authtoken YOUR_TOKEN`

### Q: 地址打不开或加载很慢？

**A**: 可能的原因和解决方法：

1. **检查本地服务器**
   - 确认命令行显示 "Dashboard 已启动"
   - 尝试访问 http://localhost:3002 确认本地正常

2. **ngrok 状态**
   - 确认 ngrok 显示 "Session Status: online"
   - 如果显示 "offline"，按 Ctrl+C 重启脚本

3. **网络问题**
   - ngrok 免费版速度可能较慢
   - 尝试刷新页面或稍后重试

### Q: 如何更改访问密码？

**A**: 编辑文件 `app/api/auth/login/route.ts`

找到这行：
```typescript
const CORRECT_PASSWORD = 'Myshell.ai'
```

改为你想要的密码：
```typescript
const CORRECT_PASSWORD = '你的新密码'
```

保存后重启服务。

### Q: 忘记密码怎么办？

**A**: 清除浏览器 Cookie 后会要求重新登录，密码是 `Myshell.ai`

**Chrome/Edge 清除 Cookie**：
1. 按 F12 打开开发者工具
2. Application → Cookies
3. 找到并删除 `auth` Cookie
4. 刷新页面

### Q: 可以同时有多人访问吗？

**A**: 可以，ngrok 免费版支持：
- 每分钟最多 40 个连接
- 适合小团队（<10人）临时分享
- 如需更多连接，考虑付费版

### Q: 如何查看访问日志？

**A**: ngrok 提供 Web 界面查看请求

1. ngrok 启动后，访问 http://127.0.0.1:4040
2. 可以看到所有 HTTP 请求
3. 包括请求时间、状态码、响应时间等

---

## 🔒 安全建议

### 1. 临时使用
- ✅ 仅在需要时启动穿透服务
- ✅ 演示完成后立即关闭
- ❌ 不要长期保持运行

### 2. 密码管理
- ✅ 定期更换密码
- ✅ 不要在公开场合分享
- ✅ 使用完毕告知访问者

### 3. 数据安全
- ⚠️ 不建议在穿透环境下操作敏感数据
- ⚠️ 不要通过公网上传机密信息
- ✅ 仅用于查看和演示

---

## 💡 使用场景

### ✅ 适合的场景
- 临时向同事/客户展示 Dashboard
- 远程演示和讲解
- 快速分享数据给几个人查看
- 测试公网访问功能

### ❌ 不适合的场景
- 长期对外提供服务（建议使用 Cloudflare Tunnel）
- 大量用户访问（超过10人）
- 需要固定地址（每次都会变）
- 处理敏感数据（安全性有限）

---

## 📊 性能说明

### 延迟
- ngrok 会增加约 100-200ms 延迟
- 免费版服务器在国外，可能更慢
- 适合演示，不适合实时操作

### 带宽
- 免费版无带宽限制
- 但速度取决于 ngrok 服务器
- 适合查看数据，不适合大文件传输

---

## 🎯 快速命令参考

```bash
# 启动内网穿透
start-with-ngrok.bat

# 仅启动本地服务器（无穿透）
start-dev.bat

# 检查 ngrok 是否安装
ngrok version

# 配置 ngrok authtoken（首次使用）
ngrok config add-authtoken YOUR_TOKEN
```

---

## 📞 获取帮助

- ngrok 官方文档：https://ngrok.com/docs
- ngrok 下载页面：https://ngrok.com/download
- 项目 README：[../README.md](../README.md)

---

**更新时间**: 2025-11-12
**版本**: v1.0
