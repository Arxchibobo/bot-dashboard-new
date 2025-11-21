// 从 Honeycomb 获取最新数据并更新本地 JSON 文件

// 首先加载环境变量（必须在导入 honeycomb-client 之前）
import { config } from 'dotenv'
import path from 'path'
config({ path: path.join(process.cwd(), '.env.local') })

// 然后导入其他模块
import { fetchHoneycombData } from '../lib/honeycomb-client'
import { writeFile, mkdir } from 'fs/promises'

async function main() {
  try {
    console.log('🔄 正在从 Honeycomb 获取最新数据...')
    console.log('   数据集: myshell-art-web')
    console.log('   时间范围: 过去 3 天')
    console.log('')
    console.log('🔍 调试信息:')
    console.log(`   API Key: ${process.env.HONEYCOMB_API_KEY ? '已配置' : '未配置'}`)
    console.log(`   Team: ${process.env.HONEYCOMB_TEAM}`)
    console.log(`   Dataset: ${process.env.HONEYCOMB_DATASET}`)
    console.log('')

    // 调用 Honeycomb API
    const data = await fetchHoneycombData()

    // 确保 data 目录存在
    const dataDir = path.join(process.cwd(), 'data')
    await mkdir(dataDir, { recursive: true })

    // 写入文件
    const filePath = path.join(dataDir, 'bot-interactions.json')
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')

    // 显示成功信息
    console.log('✅ 数据更新成功！')
    console.log('')
    console.log('📊 数据摘要:')
    console.log(`   - Bot 数量: ${data.bots.length}`)
    console.log(`   - 总事件数: ${data.totalEvents.toLocaleString()}`)
    console.log(`   - 独立用户数: ${data.totalUsers.toLocaleString()}`)
    console.log(`   - 更新时间: ${new Date(data.lastUpdate).toLocaleString('zh-CN')}`)
    console.log('')
    console.log(`💾 数据已保存到: ${filePath}`)

  } catch (error) {
    console.error('')
    console.error('❌ 数据更新失败')
    console.error('')
    if (error instanceof Error) {
      console.error(`错误信息: ${error.message}`)
    } else {
      console.error('未知错误:', error)
    }
    console.error('')
    process.exit(1)
  }
}

main()
