#!/bin/bash
# ================================================
# Bot Dashboard 一键启动脚本 (Git Bash / Linux)
# ================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   Bot Dashboard 启动脚本"
echo "========================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 Node.js，请先安装 Node.js${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo -e "${BLUE}[信息] Node.js 版本:${NC}"
node --version
echo ""

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 npm${NC}"
    exit 1
fi

echo -e "${BLUE}[信息] npm 版本:${NC}"
npm --version
echo ""

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[提示] 检测到 node_modules 不存在，开始安装依赖...${NC}"
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 依赖安装失败${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}[成功] 依赖安装完成${NC}"
    echo ""
fi

# 检查端口 3002 是否被占用（Windows 环境）
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "${BLUE}[检查] 正在检查端口 3002 是否可用...${NC}"
    PORT_PID=$(netstat -ano | grep ":3002" | awk '{print $5}' | head -n 1)

    if [ ! -z "$PORT_PID" ]; then
        echo -e "${YELLOW}[警告] 端口 3002 已被占用 (PID: $PORT_PID)${NC}"
        echo ""
        read -p "是否终止占用该端口的进程？(Y/N): " KILL_PORT

        if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[操作] 正在终止进程 $PORT_PID...${NC}"
            cmd //c "taskkill /F /PID $PORT_PID" > /dev/null 2>&1
            echo -e "${GREEN}[成功] 端口已释放${NC}"
            sleep 2
        else
            echo -e "${YELLOW}[提示] 请手动释放端口 3002 或修改 package.json 中的端口配置${NC}"
            exit 1
        fi
        echo ""
    fi
# Linux/Mac 环境
else
    PORT_PID=$(lsof -ti:3002 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo -e "${YELLOW}[警告] 端口 3002 已被占用 (PID: $PORT_PID)${NC}"
        echo ""
        read -p "是否终止占用该端口的进程？(Y/N): " KILL_PORT

        if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[操作] 正在终止进程 $PORT_PID...${NC}"
            kill -9 $PORT_PID
            echo -e "${GREEN}[成功] 端口已释放${NC}"
            sleep 2
        else
            echo -e "${YELLOW}[提示] 请手动释放端口 3002 或修改 package.json 中的端口配置${NC}"
            exit 1
        fi
        echo ""
    fi
fi

# 启动开发服务器
echo "========================================"
echo "   正在启动开发服务器..."
echo "========================================"
echo ""
echo -e "${GREEN}[信息] 访问地址: http://localhost:3002${NC}"
echo -e "${YELLOW}[提示] 按 Ctrl+C 可停止服务器${NC}"
echo ""

# 启动服务器
npm run dev

# 如果服务器意外退出
echo ""
echo -e "${YELLOW}[提示] 服务器已停止${NC}"
