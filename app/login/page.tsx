// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, AlertCircle } from 'lucide-react'

/**
 * 登录页面
 * 用户需要输入访问密码才能访问 Dashboard
 * 正确密码：Myshell.ai
 */
export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  /**
   * 处理登录表单提交
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        // 登录成功，跳转到首页
        router.push('/')
        router.refresh()
      } else {
        // 登录失败，显示错误信息
        const data = await response.json()
        setError(data.error || '密码错误，请重试')
      }
    } catch (err) {
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Bot Dashboard</CardTitle>
          <CardDescription>
            请输入访问密码以继续
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 密码输入框 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                访问密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full"
                autoFocus
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center">
              🔒 此页面受密码保护，仅授权用户可访问
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
