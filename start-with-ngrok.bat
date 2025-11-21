@echo off
chcp 65001 >nul
REM ================================================
REM Bot Dashboard 一键启动（含内网穿透）
REM 使用 ngrok 提供临时公网访问
REM 访问密码：Myshell.ai
REM ================================================

echo.
echo ========================================
echo    Bot Dashboard 内网穿透启动
echo ========================================
echo.
echo [功能] 临时公网访问 + 密码保护
echo [密码] Myshell.ai
echo [工具] ngrok
echo.

REM 设置端口
set PORT=3002

REM ================================================
REM [1/5] 检查 Node.js 环境
REM ================================================
echo [1/5] 检查环境...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未安装 Node.js
    echo [提示] 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

echo [信息] Node.js 版本:
node --version
echo.

REM ================================================
REM [2/5] 检查并安装依赖
REM ================================================
echo [2/5] 检查依赖...
if not exist "node_modules" (
    echo [提示] 检测到缺失依赖，开始安装...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
) else (
    echo [成功] 依赖已存在
)
echo.

REM ================================================
REM [3/5] 检查 ngrok
REM ================================================
echo [3/5] 检查 ngrok...
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未安装 ngrok
    echo.
    echo ========================================
    echo    ngrok 安装指南
    echo ========================================
    echo.
    echo 方法1：手动下载（推荐）
    echo   1. 访问 https://ngrok.com/download
    echo   2. 下载 Windows 版本
    echo   3. 解压到任意目录
    echo   4. 将 ngrok.exe 所在目录添加到系统 PATH
    echo.
    echo 方法2：使用 Chocolatey
    echo   choco install ngrok
    echo.
    echo 方法3：使用 Scoop
    echo   scoop install ngrok
    echo.
    pause
    exit /b 1
)

echo [成功] ngrok 已安装
echo.

REM ================================================
REM [4/5] 清理端口
REM ================================================
echo [4/5] 清理端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo [清理] 终止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 >nul
echo [成功] 端口 %PORT% 已清理
echo.

REM ================================================
REM [5/5] 启动服务
REM ================================================
echo [5/5] 启动服务...
echo.
echo ========================================
echo    正在启动 Dashboard 和 ngrok...
echo ========================================
echo.
echo [提示] 请等待服务启动...
echo.

REM 后台启动 Dashboard 服务器
start /B cmd /c "npm run dev > nul 2>&1"

REM 等待服务器启动
echo [提示] 等待 Dashboard 服务器启动（5秒）...
timeout /t 5 >nul

echo.
echo ========================================
echo    Dashboard 已启动
echo ========================================
echo.
echo [本地访问] http://localhost:%PORT%
echo [访问密码] Myshell.ai
echo.
echo [提示] 正在启动 ngrok 内网穿透...
echo [提示] 请在 ngrok 窗口中查看公网地址
echo.
echo ========================================
echo    使用说明
echo ========================================
echo.
echo 1. 在下方查找类似这样的地址：
echo    Forwarding  https://xxxx-xxxx.ngrok.io
echo.
echo 2. 将该地址分享给需要访问的人
echo.
echo 3. 访问者打开链接后输入密码：Myshell.ai
echo.
echo 4. 停止服务：按 Ctrl+C 或关闭窗口
echo.
echo ========================================
echo.

REM 启动 ngrok（前台运行，显示日志）
ngrok http %PORT%

REM ngrok 停止后的清理
echo.
echo ========================================
echo [提示] ngrok 已停止，正在清理...
echo ========================================

REM 终止 Node.js 进程
taskkill /F /IM node.exe >nul 2>nul

echo [完成] 所有服务已停止
pause
