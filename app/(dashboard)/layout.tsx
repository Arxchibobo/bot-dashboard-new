import { AppLayout } from '@/components/layout/app-layout'

/**
 * 仪表板布局
 * 包含顶部导航栏和侧边栏
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
