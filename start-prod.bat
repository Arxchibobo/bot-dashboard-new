@echo off
chcp 65001 >nul
REM ================================================
REM Bot Dashboard 生产环境一键启动脚本 (Windows)
REM 功能: 自动检查依赖、构建项目、清理端口、启动服务器
REM ================================================

echo.
echo ========================================
echo    Bot Dashboard 生产环境启动
echo ========================================
echo.

REM 设置端口号
set PORT=3002
set APP_URL=http://localhost:%PORT%

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo [提示] 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] 检查环境
echo [信息] Node.js 版本:
node --version
echo [信息] npm 版本:
npm --version
echo.

REM 检查并安装依赖
echo [2/5] 检查依赖
if not exist "node_modules" (
    echo [提示] 检测到缺失依赖，开始安装...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
) else (
    echo [成功] 依赖已存在
)
echo.

REM 检查构建输出
echo [3/5] 检查构建
if not exist ".next" (
    echo [提示] 检测到未构建，开始构建生产版本...
) else (
    echo [提示] 检测到已有构建，重新构建以确保最新...
)
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 构建失败，请检查代码错误
    pause
    exit /b 1
)
echo.
echo [成功] 构建完成
echo.

REM 检查并清理端口
echo [4/5] 检查端口
echo [检查] 正在检查端口 %PORT%...
netstat -ano | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [警告] 端口 %PORT% 已被占用
    echo [提示] 正在自动清理占用的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
        echo [清理] 终止进程 PID: %%a
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 2 >nul
    echo [成功] 端口已清理
) else (
    echo [成功] 端口 %PORT% 可用
)
echo.

REM 启动生产服务器
echo [5/5] 启动服务器
echo ========================================
echo    正在启动生产服务器...
echo ========================================
echo.
echo [信息] 访问地址: %APP_URL%
echo [提示] 按 Ctrl+C 可停止服务器
echo.

REM 询问是否自动打开浏览器
set /p OPEN_BROWSER="是否自动打开浏览器？(Y/N，默认Y): "
if "%OPEN_BROWSER%"=="" set OPEN_BROWSER=Y
if /i "%OPEN_BROWSER%"=="Y" (
    echo [提示] 3秒后自动打开浏览器...
    start "" "%APP_URL%"
)
echo.

REM 启动服务器
call npm run start

REM 服务器停止后的提示
echo.
echo ========================================
echo [提示] 服务器已停止
echo ========================================
pause
