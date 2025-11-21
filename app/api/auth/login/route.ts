// app/api/auth/login/route.ts
// 登录验证 API
// 验证用户输入的密码是否正确

import { NextRequest, NextResponse } from 'next/server'

// 正确的访问密码
const CORRECT_PASSWORD = 'Myshell.ai'

/**
 * POST /api/auth/login
 * 验证用户密码
 *
 * @param request - 包含密码的请求体
 * @returns 成功返回 200，失败返回 401
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const { password } = await request.json()

    // 验证密码
    if (password === CORRECT_PASSWORD) {
      // 密码正确，设置认证 Cookie
      const response = NextResponse.json({
        success: true,
        message: '登录成功'
      })

      // 设置 Cookie（24小时有效）
      response.cookies.set('auth', 'true', {
        httpOnly: true,        // 仅 HTTP 访问，JavaScript 无法读取
        secure: process.env.NODE_ENV === 'production',  // 生产环境使用 HTTPS
        sameSite: 'lax',       // CSRF 保护
        maxAge: 60 * 60 * 24,  // 24小时（单位：秒）
        path: '/',             // 全站有效
      })

      return response
    } else {
      // 密码错误
      return NextResponse.json(
        { error: '密码错误，请重试' },
        { status: 401 }
      )
    }
  } catch (error) {
    // 服务器错误
    console.error('登录 API 错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
