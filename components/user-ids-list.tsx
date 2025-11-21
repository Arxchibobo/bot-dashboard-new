'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserIdsListProps {
  userIds: string[]           // 用户 ID 列表
  botSlugId: string           // Bot ID
  totalUsers: number          // 总用户数
  sampleSize?: number         // 样本大小
}

/**
 * 用户 ID 列表展示组件
 * 支持搜索、分页、复制和导出功能
 */
export default function UserIdsList({
  userIds,
  botSlugId,
  totalUsers,
  sampleSize
}: UserIdsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // 搜索过滤
  const filteredIds = useMemo(() => {
    if (!searchTerm) return userIds
    const term = searchTerm.toLowerCase()
    return userIds.filter(id => id.toLowerCase().includes(term))
  }, [userIds, searchTerm])

  // 分页处理
  const paginatedIds = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredIds.slice(start, end)
  }, [filteredIds, currentPage])

  const totalPages = Math.ceil(filteredIds.length / pageSize)

  // 复制单个 ID
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success(`已复制: ${id}`)
  }

  // 复制全部 ID
  const copyAllIds = () => {
    const text = filteredIds.join('\n')
    navigator.clipboard.writeText(text)
    toast.success(`已复制 ${filteredIds.length} 个用户 ID`)
  }

  // 导出为文本文件
  const exportIds = () => {
    const text = filteredIds.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${botSlugId}_user_ids.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('导出成功')
  }

  return (
    <div className="bg-gray-50 p-4 border-t">
      {/* 头部：标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h4 className="font-medium text-gray-900">
          用户列表
          <span className="ml-2 text-sm text-gray-600">
            ({userIds.length.toLocaleString()} / {totalUsers.toLocaleString()} 位用户)
          </span>
        </h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyAllIds}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">复制全部</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportIds}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">导出</span>
          </Button>
        </div>
      </div>

      {/* 搜索框 */}
      <Input
        placeholder="搜索用户 ID..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setCurrentPage(1)  // 重置到第一页
        }}
        className="mb-3"
      />

      {/* 用户 ID 网格 */}
      {paginatedIds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
          {paginatedIds.map(userId => (
            <div
              key={userId}
              className="flex items-center gap-1 bg-white p-2 rounded border hover:border-blue-300 transition"
            >
              {/* 用户 ID 链接 */}
              <a
                href={`/users/${userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate flex-1 text-sm"
                title={userId}
              >
                {userId}
              </a>
              {/* 复制按钮 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyId(userId)}
                className="h-6 w-6 p-0 flex-shrink-0"
                title="复制"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          没有找到匹配的用户 ID
        </div>
      )}

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm text-gray-600">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">上一页</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline mr-1">下一页</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 样本数据提示 */}
      {sampleSize && userIds.length < totalUsers && (
        <div className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
          <span className="font-medium">⚠️ 样本数据：</span>
          显示前 {userIds.length.toLocaleString()} 位用户（总共 {totalUsers.toLocaleString()} 位）
        </div>
      )}
    </div>
  )
}
