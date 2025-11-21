// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import "./globals.css"

// 配置 Inter 字体
const inter = Inter({ subsets: ["latin"] })

// 页面元数据
export const metadata: Metadata = {
  title: "Bot 交互数据仪表盘",
  description: "展示 Bot 交互数据统计（2025年10月15日至今）",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航栏 */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 Bot 交互数据仪表盘
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                支持自定义时间范围查询（2025年10月15日至今）
              </p>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
