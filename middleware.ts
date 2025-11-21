// middleware.ts
// 全局中间件：拦截所有请求，验证访问密码
// 访问密码：Myshell.ai

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 中间件函数：验证用户是否已登录
 * 未登录用户会被重定向到登录页面
 */
export function middleware(request: NextRequest) {
  // 检查 Cookie 中的认证标记
  const isAuthenticated = request.cookies.get('auth')?.value === 'true'

  const { pathname } = request.nextUrl

  // 登录相关路由不需要验证（避免重定向循环）
  if (pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next()
  }

  // 静态资源不需要验证
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  // 未登录则重定向到登录页
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 已登录，放行
  return NextResponse.next()
}

/**
 * 配置中间件匹配规则
 * 匹配所有路径，但排除 _next/static、_next/image、favicon.ico
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
