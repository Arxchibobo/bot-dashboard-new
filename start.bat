@echo off
chcp 65001 >nul
REM ================================================
REM Bot Dashboard 一键启动脚本 (Windows)
REM ================================================

echo.
echo ========================================
echo    Bot Dashboard 启动脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js 版本:
node --version
echo.

REM 检查 npm 是否安装
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

echo [信息] npm 版本:
npm --version
echo.

REM 检查是否需要安装依赖
if not exist "node_modules" (
    echo [提示] 检测到 node_modules 不存在，开始安装依赖...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo [成功] 依赖安装完成
    echo.
)

REM 检查端口 3002 是否被占用
echo [检查] 正在检查端口 3002 是否可用...
netstat -ano | findstr :3002 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [警告] 端口 3002 已被占用
    echo.
    set /p KILL_PORT="是否终止占用该端口的进程？(Y/N): "
    if /i "%KILL_PORT%"=="Y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
            echo [操作] 正在终止进程 %%a...
            taskkill /F /PID %%a >nul 2>nul
        )
        echo [成功] 端口已释放
        timeout /t 2 >nul
    ) else (
        echo [提示] 请手动释放端口 3002 或修改 package.json 中的端口配置
        pause
        exit /b 1
    )
    echo.
)

REM 启动开发服务器
echo ========================================
echo    正在启动开发服务器...
echo ========================================
echo.
echo [信息] 访问地址: http://localhost:3002
echo [提示] 按 Ctrl+C 可停止服务器
echo.

REM 启动服务器
call npm run dev

REM 如果服务器意外退出
echo.
echo [提示] 服务器已停止
pause
