// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "@/components/theme-provider"
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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
