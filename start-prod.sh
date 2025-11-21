#!/bin/bash
# ================================================
# Bot Dashboard 生产环境启动脚本 (Git Bash / Linux)
# ================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "========================================"
echo "   Bot Dashboard 生产环境启动"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 Node.js${NC}"
    exit 1
fi

echo -e "${BLUE}[信息] Node.js 版本:${NC}"
node --version
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[提示] 开始安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 依赖安装失败${NC}"
        exit 1
    fi
fi

# 构建项目
echo -e "${BLUE}[提示] 正在构建生产版本...${NC}"
echo ""
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 构建失败${NC}"
    exit 1
fi
echo ""
echo -e "${GREEN}[成功] 构建完成${NC}"
echo ""

# 检查端口（Windows）
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    PORT_PID=$(netstat -ano | grep ":3002" | awk '{print $5}' | head -n 1)
    if [ ! -z "$PORT_PID" ]; then
        echo -e "${YELLOW}[警告] 端口 3002 已被占用 (PID: $PORT_PID)${NC}"
        read -p "是否终止占用该端口的进程？(Y/N): " KILL_PORT
        if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
            cmd //c "taskkill /F /PID $PORT_PID" > /dev/null 2>&1
            sleep 2
        else
            exit 1
        fi
    fi
# Linux/Mac
else
    PORT_PID=$(lsof -ti:3002 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo -e "${YELLOW}[警告] 端口 3002 已被占用 (PID: $PORT_PID)${NC}"
        read -p "是否终止占用该端口的进程？(Y/N): " KILL_PORT
        if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
            kill -9 $PORT_PID
            sleep 2
        else
            exit 1
        fi
    fi
fi
echo ""

# 启动生产服务器
echo "========================================"
echo "   正在启动生产服务器..."
echo "========================================"
echo ""
echo -e "${GREEN}[信息] 访问地址: http://localhost:3002${NC}"
echo -e "${YELLOW}[提示] 按 Ctrl+C 可停止服务器${NC}"
echo ""

npm run start

echo ""
echo -e "${YELLOW}[提示] 服务器已停止${NC}"
